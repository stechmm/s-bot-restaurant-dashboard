import logging
import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.models import Order, OrderItem

logger = logging.getLogger("scheduler")

scheduler = AsyncIOScheduler(timezone="Asia/Rangoon")

async def send_daily_sales_report():
    """Send daily sales summary to Admin Telegram every evening at 6 PM."""
    from app.bot.bot_service import bot_service
    from app.core.config import settings

    admin_chat_id = settings.ADMIN_TELEGRAM_ID or settings.SUPPORT_NOTIFICATION_CHAT_ID
    if not admin_chat_id or not bot_service.application:
        logger.warning("Daily report: No admin chat ID or bot not running.")
        return

    today = datetime.date.today()
    start = datetime.datetime(today.year, today.month, today.day, 0, 0, 0)
    end   = datetime.datetime(today.year, today.month, today.day, 23, 59, 59)

    async with AsyncSessionLocal() as session:
        # Total orders today
        orders_result = await session.execute(
            select(Order).where(Order.created_at >= start, Order.created_at <= end)
        )
        orders = orders_result.scalars().all()
        total_orders = len(orders)
        total_revenue = sum(o.total_amount for o in orders)
        pending = sum(1 for o in orders if o.status == "Pending")
        delivered = sum(1 for o in orders if o.status == "Delivered")

        # Best selling item today
        items_result = await session.execute(
            select(OrderItem.product_name, func.sum(OrderItem.quantity).label("qty"))
            .join(Order, OrderItem.order_id == Order.id)
            .where(Order.created_at >= start, Order.created_at <= end)
            .group_by(OrderItem.product_name)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(3)
        )
        top_items = items_result.all()

    top_items_text = ""
    for i, item in enumerate(top_items, 1):
        top_items_text += f"  {i}. {item.product_name} ({item.qty} ခု)\n"
    if not top_items_text:
        top_items_text = "  (မရှိပါ)\n"

    report_msg = (
        f"📊 <b>နေ့စဉ် အရောင်းအဝယ် အစီရင်ခံစာ</b>\n"
        f"📅 {today.strftime('%Y-%m-%d')} (မြန်မာစံတော်ချိန်)\n\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"🛒 <b>ဝင်ရောက်သော Order:</b> {total_orders} ခု\n"
        f"💵 <b>စုစုပေါင်း ဝင်ငွေ:</b> {total_revenue:,.0f} MMK\n"
        f"⏳ <b>Pending:</b> {pending} ခု\n"
        f"🎉 <b>Delivered:</b> {delivered} ခု\n\n"
        f"🏆 <b>အရောင်းရဆုံး ပစ္စည်းများ:</b>\n{top_items_text}"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"<i>S-Bot Auto Report</i>"
    )

    try:
        await bot_service.application.bot.send_message(
            chat_id=int(admin_chat_id),
            text=report_msg,
            parse_mode="HTML"
        )
        logger.info("Daily sales report sent to admin.")
    except Exception as e:
        logger.error(f"Failed to send daily report: {e}")


def start_scheduler():
    # Send daily report at 18:00 (6 PM) Myanmar time every day
    scheduler.add_job(
        send_daily_sales_report,
        trigger="cron",
        hour=18,
        minute=0,
        id="daily_sales_report",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler started: Daily sales report at 18:00 MMT")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped.")
