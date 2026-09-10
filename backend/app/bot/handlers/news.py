import logging
from sqlalchemy import select
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from app.core.database import AsyncSessionLocal
from app.models.models import NewsPost
from app.bot.utils import get_or_create_user

logger = logging.getLogger("telegram_bot")

async def show_news_list(update: Update, context: ContextTypes.DEFAULT_TYPE):
    store_id = context.bot_data.get("store_id", 1)
    await get_or_create_user(update.effective_user, store_id=store_id)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(NewsPost).where(NewsPost.store_id == store_id, NewsPost.is_published == True).order_by(NewsPost.created_at.desc()).limit(10)
        )
        posts = result.scalars().all()

    if not posts:
        msg = "📰 <b>သတင်းနှင့် ကြေညာချက်များ</b>\n\nလတ်တလော သတင်းအသစ် မရှိသေးပါ။"
        if update.callback_query:
            await update.callback_query.answer()
            await update.callback_query.edit_message_text(msg, parse_mode="HTML")
        else:
            await update.message.reply_text(msg, parse_mode="HTML")
        return

    text = "📰 <b>နောက်ဆုံးရ သတင်းနှင့် ကြေညာချက်များ</b>\n\nဖတ်ရှုလိုသော သတင်းခေါင်းစဉ်ကို ရွေးချယ်ပါ-\n"
    keyboard = []
    for post in posts:
        keyboard.append([InlineKeyboardButton(f"📌 {post.title}", callback_data=f"news_{post.id}")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(text, reply_markup=reply_markup, parse_mode="HTML")
    else:
        await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="HTML")

async def news_detail_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    news_id = int(query.data.split("_")[1])

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(NewsPost).where(NewsPost.id == news_id))
        post = result.scalar_one_or_none()
        if post:
            post.views_count = (post.views_count or 0) + 1
            await session.commit()

    if not post:
        await query.edit_message_text("သတင်းရှာမတွေ့ပါ။")
        return

    text = (
        f"📰 <b>{post.title}</b>\n\n"
        f"{post.content}\n\n"
        f"📅 <i>{post.created_at.strftime('%Y-%m-%d %H:%M')}</i> | 👁️ <i>{post.views_count} views</i>"
    )

    keyboard = []
    if post.button_text and post.button_url:
        keyboard.append([InlineKeyboardButton(text=post.button_text, url=post.button_url)])
    keyboard.append([InlineKeyboardButton("🔙 သတင်းများ စာရင်းသို့", callback_data="back_news")])

    reply_markup = InlineKeyboardMarkup(keyboard)

    if post.image_url:
        try:
            await query.message.reply_photo(
                photo=post.image_url,
                caption=text,
                reply_markup=reply_markup,
                parse_mode="HTML"
            )
            await query.message.delete()
            return
        except Exception:
            pass

    await query.edit_message_text(text, reply_markup=reply_markup, parse_mode="HTML")

def register_news_handlers(app: Application):
    app.add_handler(CommandHandler("news", show_news_list))
    app.add_handler(MessageHandler(filters.Regex(r"^(📰 သတင်းများ \(News\)|📰 သတင်းနှင့် ပရိုမိုးရှင်း)$"), show_news_list))
    app.add_handler(CallbackQueryHandler(show_news_list, pattern="^back_news$"))
    app.add_handler(CallbackQueryHandler(news_detail_handler, pattern="^news_"))
