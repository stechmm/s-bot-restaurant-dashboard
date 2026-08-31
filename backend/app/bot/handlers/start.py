import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from app.bot.utils import get_main_keyboard, get_or_create_user
from app.core.config import settings

logger = logging.getLogger("telegram_bot")

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = await get_or_create_user(update.effective_user)
    welcome_text = (
        f"👋 မင်္ဂလာပါ <b>{update.effective_user.first_name}</b>!\n\n"
        f"🌟 <b>{settings.STORE_NAME}</b> မှ ကြိုဆိုပါတယ်။\n"
        f"ကျွန်ုပ်တို့၏ Bot မှတစ်ဆင့် ကုန်ပစ္စည်းများ ကြည့်ရှုဝယ်ယူနိုင်ခြင်း၊ "
        f"Customer Support အဖွဲ့နှင့် တိုက်ရိုက် စကားပြောနိုင်ခြင်း၊ "
        f"သတင်းနှင့် ပရိုမိုးရှင်းများကို ရယူနိုင်ပါသည်။\n\n"
        f"👇 အောက်ပါ Menu မှ မိမိအလိုရှိရာကို ရွေးချယ်နိုင်ပါသည်-"
    )
    await update.message.reply_text(
        text=welcome_text,
        reply_markup=get_main_keyboard(),
        parse_mode="HTML"
    )

async def about_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await get_or_create_user(update.effective_user)
    about_text = (
        f"ℹ️ <b>{settings.STORE_NAME} အကြောင်း</b>\n\n"
        f"✨ အကောင်းဆုံး ဝန်ဆောင်မှုနှင့် အရည်အသွေးမြင့် ကုန်ပစ္စည်းများကို အဆင်ပြေ လွယ်ကူစွာ ဝယ်ယူရရှိနိုင်ပါသည်။\n\n"
        f"📞 <b>ဆက်သွယ်ရန်:</b>\n"
        f"• Customer Support: Bot အတွင်း '💬 Customer Support' ကိုနှိပ်ပါ\n"
        f"• Payment Options: KBZPay, WavePay, Cash on Delivery\n"
        f"• Delivery: ရန်ကုန်၊ မန္တလေးနှင့် မြန်မာနိုင်ငံအနှံ့ ပို့ဆောင်ပေးပါသည်\n\n"
        f"ကျေးဇူးတင်ရှိပါသည်! 🙏"
    )
    await update.message.reply_text(about_text, parse_mode="HTML")

def register_start_handlers(app: Application):
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", start_command))
    app.add_handler(MessageHandler(filters.Regex("^ℹ️ ဆိုင်အချက်အလက် \(About\)$"), about_handler))
