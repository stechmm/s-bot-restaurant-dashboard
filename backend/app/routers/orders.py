from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import Order, BotUser
from app.schemas.schemas import OrderOut, OrderStatusUpdate
from app.routers.deps import get_store_id
from app.bot.multi_bot_manager import multi_bot_manager

router = APIRouter(prefix="/orders", tags=["Orders Management"])

@router.get("/", response_model=List[OrderOut])
async def list_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    store_id: Optional[int] = Depends(get_store_id),
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
    if store_id is not None:
        query = query.where(Order.store_id == store_id)
    if status:
        query = query.where(Order.status == status)
    if search:
        query = query.where(
            (Order.order_code.ilike(f"%{search}%")) |
            (Order.customer_name.ilike(f"%{search}%")) |
            (Order.customer_phone.ilike(f"%{search}%"))
        )
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.patch("/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: int, 
    payload: OrderStatusUpdate, 
    notify_user: bool = Query(True),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status
    order.status = payload.status
    if payload.notes:
        order.notes = payload.notes
    await db.commit()
    await db.refresh(order)

    # If linked to a Telegram user and notify_user is True, send update message via store's bot
    if notify_user and order.user_id:
        user_res = await db.execute(select(BotUser).where(BotUser.id == order.user_id))
        user = user_res.scalar_one_or_none()
        if user and user.telegram_id:
            status_emojis = {
                "Pending": "⏳",
                "Confirmed": "✅",
                "Cooking": "👨‍🍳",
                "Out for Delivery": "🚚",
                "Delivered": "🎉",
                "Cancelled": "❌"
            }
            emoji = status_emojis.get(payload.status, "📌")
            notify_text = (
                f"📢 <b>အော်ဒါ အခြေအနေ အသိပေးချက်</b>\n\n"
                f"သင်၏ Order <code>{order.order_code}</code> အခြေအနေသည် <b>{emoji} {payload.status}</b> သို့ ပြောင်းလဲသွားပါပြီ။\n"
            )
            if payload.notes:
                notify_text += f"\n📝 မှတ်ချက်: {payload.notes}"
            notify_text += "\n\nကျေးဇူးတင်ရှိပါသည်! 🙏"

            bot_app = multi_bot_manager.get_bot(order.store_id or 1)
            if bot_app and bot_app.bot:
                try:
                    await bot_app.bot.send_message(
                        chat_id=user.telegram_id,
                        text=notify_text,
                        parse_mode="HTML"
                    )

                    # If delivered, send review request
                    if payload.status == "Delivered":
                        from telegram import InlineKeyboardButton, InlineKeyboardMarkup
                        review_keyboard = InlineKeyboardMarkup([[
                            InlineKeyboardButton("⭐ Rating ပေးမည်", callback_data=f"review_start_{order.id}")
                        ]])
                        await bot_app.bot.send_message(
                            chat_id=user.telegram_id,
                            text=(
                                "🎉 <b>ပစ္စည်းရရှိပြီးပါပြီ!</b>\n\n"
                                "ကျွန်တော်တို့၏ ဝန်ဆောင်မှုအပေါ် Rating တစ်ခုပေးပါ-"
                            ),
                            reply_markup=review_keyboard,
                            parse_mode="HTML"
                        )
                except Exception as e:
                    pass

    return order
