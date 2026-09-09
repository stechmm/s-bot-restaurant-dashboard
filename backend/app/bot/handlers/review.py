import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CallbackQueryHandler, ContextTypes
from app.core.database import AsyncSessionLocal
from app.models.review import Review
from app.models.models import Order, BotUser
from sqlalchemy import select

logger = logging.getLogger("telegram_bot")

async def ask_review_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """When admin changes status to Delivered, bot asks for review."""
    query = update.callback_query
    await query.answer()
    data = query.data  # format: review_start_{order_id}
    order_id = int(data.split("_")[2])
    context.user_data["review_order_id"] = order_id

    keyboard = [
        [
            InlineKeyboardButton("⭐", callback_data=f"rate_{order_id}_1"),
            InlineKeyboardButton("⭐⭐", callback_data=f"rate_{order_id}_2"),
            InlineKeyboardButton("⭐⭐⭐", callback_data=f"rate_{order_id}_3"),
        ],
        [
            InlineKeyboardButton("⭐⭐⭐⭐", callback_data=f"rate_{order_id}_4"),
            InlineKeyboardButton("⭐⭐⭐⭐⭐", callback_data=f"rate_{order_id}_5"),
        ],
        [InlineKeyboardButton("⏭️ ကျော်မည်", callback_data=f"rate_{order_id}_skip")]
    ]
    await query.edit_message_text(
        "⭐ <b>အကဲဖြတ်ချက် ပေးခြင်း</b>\n\n"
        "ကျွန်တော်တို့၏ ဝန်ဆောင်မှုနှင့် အစားအစာများ မည်မျှကောင်းမွန်ပါသနည်း?\n"
        "ကြယ်ပွင့် ရွေးချယ်ပေးပါ-",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="HTML"
    )

async def rate_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    parts = query.data.split("_")  # rate_{order_id}_{rating}
    order_id = int(parts[1])
    rating_str = parts[2]

    if rating_str == "skip":
        await query.edit_message_text("ကျေးဇူးတင်ပါသည်! 🙏 နောက်ကြိမ်လည်း S-Bot ကိုမှာကြပါ။")
        return

    rating = int(rating_str)
    stars = "⭐" * rating

    # Store review in DB
    from app.bot.utils import get_or_create_user
    user = await get_or_create_user(update.effective_user)

    async with AsyncSessionLocal() as session:
        rev = Review(
            order_id=order_id,
            user_id=user.id,
            rating=rating,
            comment=None
        )
        session.add(rev)
        await session.commit()

    await query.edit_message_text(
        f"✅ {stars} Rating ပေးပြီးပါပြီ! ကျေးဇူးတင်ပါသည် 🙏\n\n"
        f"သင်၏ တုံ့ပြန်ချက်သည် ကျွန်တော်တို့ တိုးတက်ကောင်းမွန်ရန် အထောက်အကူဖြစ်ပါသည်။",
        parse_mode="HTML"
    )


def register_review_handlers(app: Application):
    app.add_handler(CallbackQueryHandler(ask_review_callback, pattern="^review_start_"))
    app.add_handler(CallbackQueryHandler(rate_callback, pattern="^rate_"))
