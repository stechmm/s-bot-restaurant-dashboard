import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from app.bot.utils import get_main_keyboard, get_or_create_user
from app.core.config import settings

logger = logging.getLogger("telegram_bot")

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    store_id = context.bot_data.get("store_id", 1)
    store_name = context.bot_data.get("store_name", settings.STORE_NAME)
    business_type = context.bot_data.get("business_type", "restaurant")
    user = await get_or_create_user(update.effective_user, store_id=store_id)
    
    if business_type == "restaurant":
        welcome_text = (
            f"👋 မင်္ဂလာပါ <b>{update.effective_user.first_name}</b>!\n\n"
            f"🍲 <b>{store_name}</b> မှ ကြိုဆိုပါတယ်။\n"
            f"ကျွန်ုပ်တို့၏ Bot မှတစ်ဆင့် အရသာရှိသော အစားအစာနှင့် ဟင်းလျာများကို အလွယ်တကူ မှာယူနိုင်ခြင်း၊ "
            f"Customer Support နှင့် တိုက်ရိုက် စကားပြောနိုင်ခြင်း၊ "
            f"သတင်းနှင့် ပရိုမိုးရှင်းများကို ရယူနိုင်ပါသည်။\n\n"
            f"👇 အောက်ပါ Menu မှ မိမိအလိုရှိရာကို ရွေးချယ်နိုင်ပါသည်-"
        )
    else:
        welcome_text = (
            f"👋 မင်္ဂလာပါ <b>{update.effective_user.first_name}</b>!\n\n"
            f"🌟 <b>{store_name}</b> မှ ကြိုဆိုပါတယ်။\n"
            f"ကျွန်ုပ်တို့၏ Bot မှတစ်ဆင့် ကုန်ပစ္စည်းများ ကြည့်ရှုဝယ်ယူနိုင်ခြင်း၊ "
            f"Customer Support အဖွဲ့နှင့် တိုက်ရိုက် စကားပြောနိုင်ခြင်း၊ "
            f"သတင်းနှင့် ပရိုမိုးရှင်းများကို ရယူနိုင်ပါသည်။\n\n"
            f"👇 အောက်ပါ Menu မှ မိမိအလိုရှိရာကို ရွေးချယ်နိုင်ပါသည်-"
        )
    await update.message.reply_text(
        text=welcome_text,
        reply_markup=get_main_keyboard(business_type),
        parse_mode="HTML"
    )

async def about_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    store_id = context.bot_data.get("store_id", 1)
    store_name = context.bot_data.get("store_name", settings.STORE_NAME)
    business_type = context.bot_data.get("business_type", "restaurant")
    await get_or_create_user(update.effective_user, store_id=store_id)
    
    if business_type == "restaurant":
        about_text = (
            f"ℹ️ <b>{store_name} အကြောင်း</b>\n\n"
            f"🍲 အကောင်းဆုံး အရသာနှင့် လတ်ဆတ်သန့်ရှင်းသော အစားအသောက် ဟင်းလျာများကို အဆင်ပြေ လွယ်ကူစွာ မှာယူစားသုံးနိုင်ပါသည်။\n\n"
            f"📞 <b>ဆက်သွယ်ရန်:</b>\n"
            f"• စားသောက်ဆိုင်သို့ ဆက်သွယ်ရန်: Bot အတွင်း '💬 Customer Support' ကိုနှိပ်ပါ\n"
            f"• Payment Options: KBZPay, WavePay, Cash on Delivery\n"
            f"• Delivery: အမြန်ဆုံး ပို့ဆောင်ပေးပါသည်\n\n"
            f"ကျေးဇူးတင်ရှိပါသည်! 🙏"
        )
    else:
        about_text = (
            f"ℹ️ <b>{store_name} အကြောင်း</b>\n\n"
            f"✨ အကောင်းဆုံး ဝန်ဆောင်မှုနှင့် အရည်အသွေးမြင့် ကုန်ပစ္စည်းများကို အဆင်ပြေ လွယ်ကူစွာ ဝယ်ယူရရှိနိုင်ပါသည်။\n\n"
            f"📞 <b>ဆက်သွယ်ရန်:</b>\n"
            f"• Customer Support: Bot အတွင်း '💬 Customer Support' ကိုနှိပ်ပါ\n"
            f"• Payment Options: KBZPay, WavePay, Cash on Delivery\n"
            f"• Delivery: အမြန်ဆုံး ပို့ဆောင်ပေးပါသည်\n\n"
            f"ကျေးဇူးတင်ရှိပါသည်! 🙏"
        )
    await update.message.reply_text(about_text, parse_mode="HTML")

def register_start_handlers(app: Application):
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", start_command))
    app.add_handler(MessageHandler(filters.Regex(r"^(ℹ️ ဆိုင်အချက်အလက် \(About\)|ℹ️ ဆိုင်အကြောင်း \(About\))$"), about_handler))
