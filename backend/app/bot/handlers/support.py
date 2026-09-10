import logging
import datetime
from sqlalchemy import select
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, MessageHandler, 
    filters, ContextTypes, ConversationHandler
)
from app.core.database import AsyncSessionLocal
from app.models.models import BotUser, FAQ, ChatMessage
from app.bot.utils import get_main_keyboard, get_or_create_user

logger = logging.getLogger("telegram_bot")

SUPPORT_CHAT_STATE = 1

async def support_menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    store_id = context.bot_data.get("store_id", 1)
    await get_or_create_user(update.effective_user, store_id=store_id)

    text = (
        "💬 <b>Customer Support ဝန်ဆောင်မှု</b>\n\n"
        "သင်သိရှိလိုသည်များကို အောက်ပါ Menu မှ ရွေးချယ်နိုင်ပါသည်-\n"
        "• မေးလေ့ရှိသော မေးခွန်းများ (FAQ) ဖတ်ရှုရန်\n"
        "• Support Admin နှင့် တိုက်ရိုက် စကားပြောရန်"
    )

    keyboard = [
        [InlineKeyboardButton("❓ မေးလေ့ရှိသော မေးခွန်းများ (FAQ)", callback_data="faq_list")],
        [InlineKeyboardButton("👨‍💼 Support Admin နှင့် တိုက်ရိုက် စကားပြောရန်", callback_data="start_live_chat")]
    ]

    reply_markup = InlineKeyboardMarkup(keyboard)
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(text, reply_markup=reply_markup, parse_mode="HTML")
    else:
        await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="HTML")

async def faq_list_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    store_id = context.bot_data.get("store_id", 1)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(FAQ).where(FAQ.store_id == store_id, FAQ.is_active == True).order_by(FAQ.order_index)
        )
        faqs = result.scalars().all()

    if not faqs:
        keyboard = [[InlineKeyboardButton("🔙 Back to Support", callback_data="back_support")]]
        await query.edit_message_text(
            "မေးခွန်းများ မရှိသေးပါ။",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return

    keyboard = []
    for faq in faqs:
        keyboard.append([InlineKeyboardButton(f"❓ {faq.question}", callback_data=f"faq_ans_{faq.id}")])
    keyboard.append([InlineKeyboardButton("🔙 Back to Support", callback_data="back_support")])

    await query.edit_message_text(
        "❓ <b>မေးလေ့ရှိသော မေးခွန်းများ (FAQ)</b>\n\nသိလိုသော မေးခွန်းကို နှိပ်ပါ-",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="HTML"
    )

async def faq_answer_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    faq_id = int(query.data.split("_")[2])

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(FAQ).where(FAQ.id == faq_id))
        faq = result.scalar_one_or_none()

    if not faq:
        await query.edit_message_text("မေးခွန်းရှာမတွေ့ပါ။")
        return

    text = f"❓ <b>{faq.question}</b>\n\n💡 <b>အဖြေ:</b>\n{faq.answer}"
    keyboard = [
        [InlineKeyboardButton("🔙 မေးခွန်းများစာရင်းသို့", callback_data="faq_list")],
        [InlineKeyboardButton("👨‍💼 Support Admin နှင့် စကားပြောရန်", callback_data="start_live_chat")]
    ]

    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")

# --- Live Support Chat Mode ---
async def start_live_chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    store_id = context.bot_data.get("store_id", 1)
    user = await get_or_create_user(update.effective_user, store_id=store_id)

    welcome_msg = (
        "👨‍💼 <b>Support Agent နှင့် ချိတ်ဆက်ပြီးပါပြီ</b>\n\n"
        "သင်မေးမြန်းလိုသည်များကို ဤနေရာတွင် စာရိုက်ပို့ပေးနိုင်ပါသည်။\n"
        "Admin မှ စစ်ဆေးပြီး အမြန်ဆုံး အကြောင်းပြန်ပေးပါမည်။\n\n"
        "(Live Chat မှ ထွက်လိုပါက /exit သို့မဟုတ် '🚪 ထွက်မည်' ကို နှိပ်ပါ)"
    )

    await query.message.reply_text(
        welcome_msg,
        parse_mode="HTML"
    )
    return SUPPORT_CHAT_STATE

async def live_chat_message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if text in ["/exit", "🚪 ထွက်မည်", "/stop", "exit"]:
        business_type = context.bot_data.get("business_type", "restaurant")
        await update.message.reply_text(
            "👋 Live Chat မှ ထွက်လိုက်ပါပြီ။ ကျေးဇူးတင်ရှိပါသည်!",
            reply_markup=get_main_keyboard(business_type)
        )
        return ConversationHandler.END

    store_id = context.bot_data.get("store_id", 1)
    user = await get_or_create_user(update.effective_user, store_id=store_id)

    # Save to ChatMessage with store_id
    async with AsyncSessionLocal() as session:
        msg = ChatMessage(
            store_id=store_id,
            user_id=user.id,
            sender="user",
            message=text or "[Photo/Media]",
            is_read=False,
            created_at=datetime.datetime.utcnow()
        )
        session.add(msg)
        await session.commit()

    await update.message.reply_text(
        "📩 သင့်မက်ဆေ့ခ်ျကို လက်ခံရရှိပါသည်။ Admin မှ မကြာမီ ပြန်လည်ဖြေကြားပေးပါမည်။",
        parse_mode="HTML"
    )
    return SUPPORT_CHAT_STATE

async def live_chat_exit(update: Update, context: ContextTypes.DEFAULT_TYPE):
    business_type = context.bot_data.get("business_type", "restaurant")
    await update.message.reply_text("👋 Live Chat မှ ထွက်လိုက်ပါပြီ။", reply_markup=get_main_keyboard(business_type))
    return ConversationHandler.END

def register_support_handlers(app: Application):
    app.add_handler(MessageHandler(filters.Regex("^(💬 Customer Support|💬 ဆိုင်သို့ မေးမြန်းရန်|💬 စားသောက်ဆိုင်သို့ ဆက်သွယ်ရန်)$"), support_menu_handler))
    app.add_handler(CallbackQueryHandler(support_menu_handler, pattern="^back_support$"))
    app.add_handler(CallbackQueryHandler(faq_list_handler, pattern="^faq_list$"))
    app.add_handler(CallbackQueryHandler(faq_answer_handler, pattern="^faq_ans_"))

    live_chat_conv = ConversationHandler(
        entry_points=[
            CallbackQueryHandler(start_live_chat, pattern="^start_live_chat$"),
            CommandHandler("support", start_live_chat)
        ],
        states={
            SUPPORT_CHAT_STATE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, live_chat_message_handler),
                MessageHandler(filters.PHOTO | filters.ATTACHMENT, live_chat_message_handler)
            ]
        },
        fallbacks=[
            CommandHandler("exit", live_chat_exit),
            MessageHandler(filters.Regex("^(🚪 ထွက်မည်|/exit)$"), live_chat_exit)
        ]
    )
    app.add_handler(live_chat_conv)
