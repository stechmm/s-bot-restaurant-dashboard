import logging
import uuid
import datetime
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, MessageHandler, 
    filters, ContextTypes, ConversationHandler
)
from app.core.database import AsyncSessionLocal
from app.models.models import BotUser, Category, Product, CartItem, Order, OrderItem, AppSetting
from app.bot.utils import get_main_keyboard, get_or_create_user

logger = logging.getLogger("telegram_bot")

# Checkout States
CHECKOUT_NAME, CHECKOUT_PHONE, CHECKOUT_ADDRESS, CHECKOUT_PAYMENT, CHECKOUT_SLIP = range(5)

async def show_categories(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await get_or_create_user(update.effective_user)
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Category).where(Category.is_active == True))
        categories = result.scalars().all()

    if not categories:
        await update.message.reply_text("ယခုအချိန်တွင် ကုန်ပစ္စည်း အမျိုးအစားများ မရှိသေးပါ။")
        return

    keyboard = []
    for cat in categories:
        keyboard.append([InlineKeyboardButton(f"{cat.icon or '📦'} {cat.name}", callback_data=f"cat_{cat.id}")])
    keyboard.append([InlineKeyboardButton("🛒 ခြင်းတောင်း ကြည့်ရန် (Cart)", callback_data="view_cart")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    msg_text = "🛍️ <b>ကုန်ပစ္စည်း အမျိုးအစားများ (Categories)</b>\n\nမိမိကြည့်ရှုလိုသော အမျိုးအစားကို ရွေးချယ်ပါ-"
    
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(msg_text, reply_markup=reply_markup, parse_mode="HTML")
    else:
        await update.message.reply_text(msg_text, reply_markup=reply_markup, parse_mode="HTML")

async def category_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    cat_id = int(query.data.split("_")[1])

    async with AsyncSessionLocal() as session:
        cat_result = await session.execute(select(Category).where(Category.id == cat_id))
        category = cat_result.scalar_one_or_none()
        prod_result = await session.execute(select(Product).where(Product.category_id == cat_id, Product.is_active == True))
        products = prod_result.scalars().all()

    if not products:
        keyboard = [[InlineKeyboardButton("🔙 အမျိုးအစားများသို့ ပြန်သွားရန်", callback_data="back_categories")]]
        await query.edit_message_text(
            f"📦 <b>{category.name if category else 'Category'}</b>\n\nဤအမျိုးအစားတွင် ပစ္စည်းမရှိသေးပါ။",
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode="HTML"
        )
        return

    keyboard = []
    for prod in products:
        keyboard.append([InlineKeyboardButton(f"{prod.name} - {prod.price:,.0f} MMK", callback_data=f"prod_{prod.id}")])
    keyboard.append([InlineKeyboardButton("🔙 အမျိုးအစားများသို့ ပြန်သွားရန်", callback_data="back_categories")])
    keyboard.append([InlineKeyboardButton("🛒 ခြင်းတောင်း ကြည့်ရန်", callback_data="view_cart")])

    await query.edit_message_text(
        f"📦 <b>{category.name if category else 'Category'}</b>\n\nကြည့်ရှုလိုသော ကုန်ပစ္စည်းကို ရွေးချယ်ပါ-",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="HTML"
    )

async def product_detail_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    prod_id = int(query.data.split("_")[1])

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Product).where(Product.id == prod_id))
        prod = result.scalar_one_or_none()

    if not prod:
        await query.edit_message_text("ပစ္စည်းရှာမတွေ့ပါ။")
        return

    text = (
        f"🏷️ <b>{prod.name}</b>\n\n"
        f"📝 <b>အသေးစိတ်:</b> {prod.description or 'မရှိပါ'}\n"
        f"💰 <b>စျေးနှုန်း:</b> {prod.price:,.0f} MMK\n"
        f"📦 <b>လက်ကျန်:</b> {prod.stock} ခု\n"
    )

    keyboard = [
        [
            InlineKeyboardButton("➕ ခြင်းတောင်းထဲထည့်မည် (Add to Cart)", callback_data=f"add_cart_{prod.id}"),
        ],
        [
            InlineKeyboardButton("🔙 ကုန်ပစ္စည်းစာရင်းသို့", callback_data=f"cat_{prod.category_id}" if prod.category_id else "back_categories"),
            InlineKeyboardButton("🛒 ခြင်းတောင်း", callback_data="view_cart")
        ]
    ]

    if prod.image_url:
        try:
            await query.message.reply_photo(
                photo=prod.image_url,
                caption=text,
                reply_markup=InlineKeyboardMarkup(keyboard),
                parse_mode="HTML"
            )
            await query.message.delete()
            return
        except Exception:
            pass

    await query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")

async def add_to_cart_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer("ခြင်းတောင်းထဲသို့ ထည့်ပြီးပါပြီ! ✅", show_alert=True)
    prod_id = int(query.data.split("_")[2])

    user = await get_or_create_user(update.effective_user)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == prod_id)
        )
        cart_item = result.scalar_one_or_none()
        if cart_item:
            cart_item.quantity += 1
        else:
            cart_item = CartItem(user_id=user.id, product_id=prod_id, quantity=1)
            session.add(cart_item)
        await session.commit()

async def view_cart(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = await get_or_create_user(update.effective_user)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CartItem).options(selectinload(CartItem.product)).where(CartItem.user_id == user.id)
        )
        items = result.scalars().all()

    if not items:
        msg = "🛒 <b>သင့်ခြင်းတောင်း (Cart) သည် လက်ရှိတွင် ဗလာဖြစ်နေပါသည်။</b>\n\nပစ္စည်းများ ရွေးချယ်ဝယ်ယူရန် '🛍️ ကုန်ပစ္စည်းများ' ကို နှိပ်ပါ။"
        if update.callback_query:
            await update.callback_query.answer()
            keyboard = [[InlineKeyboardButton("🛍️ စျေးဝယ်မည်", callback_data="back_categories")]]
            await update.callback_query.edit_message_text(msg, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")
        else:
            await update.message.reply_text(msg, parse_mode="HTML")
        return

    text = "🛒 <b>သင့်ခြင်းတောင်းထဲရှိ ပစ္စည်းများ:</b>\n\n"
    total = 0.0
    keyboard = []

    for item in items:
        subtotal = item.product.price * item.quantity
        total += subtotal
        text += f"• <b>{item.product.name}</b>\n  {item.quantity} ခု x {item.product.price:,.0f} = <b>{subtotal:,.0f} MMK</b>\n"

    text += f"\n━━━━━━━━━━━━━━━━━━━━\n"
    text += f"💵 <b>စုစုပေါင်း ကျသင့်ငွေ: {total:,.0f} MMK</b>\n"

    keyboard.append([InlineKeyboardButton("✅ အော်ဒါတင်မည် (Checkout)", callback_data="start_checkout")])
    keyboard.append([
        InlineKeyboardButton("🗑️ ခြင်းတောင်းရှင်းမည်", callback_data="clear_cart"),
        InlineKeyboardButton("🛍️ ဆက်လက်ဝယ်ယူမည်", callback_data="back_categories")
    ])

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")
    else:
        await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")

async def clear_cart_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer("ခြင်းတောင်း ရှင်းလင်းပြီးပါပြီ!", show_alert=True)
    user = await get_or_create_user(update.effective_user)

    async with AsyncSessionLocal() as session:
        await session.execute(delete(CartItem).where(CartItem.user_id == user.id))
        await session.commit()

    keyboard = [[InlineKeyboardButton("🛍️ ကုန်ပစ္စည်းများ ကြည့်ရှုမည်", callback_data="back_categories")]]
    await query.edit_message_text(
        "🛒 သင့်ခြင်းတောင်းကို ရှင်းလင်းပြီးပါပြီ။",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="HTML"
    )

# --- Checkout Conversation ---
async def checkout_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user = await get_or_create_user(update.effective_user)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(CartItem).where(CartItem.user_id == user.id))
        if not result.scalars().all():
            await query.edit_message_text("ခြင်းတောင်းထဲတွင် ပစ္စည်းမရှိပါ။")
            return ConversationHandler.END

    await query.message.reply_text(
        "📝 <b>အော်ဒါတင်ရန် အချက်အလက်များ ဖြည့်စွက်ပါ</b>\n\n"
        "ကျေးဇူးပြု၍ သင့် <b>အမည် (Customer Name)</b> ကို ရိုက်ပို့ပေးပါ-\n(မလုပ်လိုပါက /cancel နှိပ်ပါ)",
        parse_mode="HTML"
    )
    return CHECKOUT_NAME

async def checkout_name_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["order_name"] = update.message.text.strip()
    await update.message.reply_text("📞 ဆက်သွယ်ရမည့် <b>ဖုန်းနံပါတ် (Phone Number)</b> ကို ရိုက်ပို့ပေးပါ-", parse_mode="HTML")
    return CHECKOUT_PHONE

async def checkout_phone_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["order_phone"] = update.message.text.strip()
    await update.message.reply_text("🏠 ပစ္စည်းပို့ဆောင်ရမည့် <b>လိပ်စာအပြည့်အစုံ (Delivery Address)</b> ကို ရိုက်ပို့ပေးပါ-", parse_mode="HTML")
    return CHECKOUT_ADDRESS

async def checkout_address_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["order_address"] = update.message.text.strip()

    keyboard = [
        [InlineKeyboardButton("💵 Cash on Delivery (အိမ်ရောက်ငွေချေ)", callback_data="pay_COD")],
        [InlineKeyboardButton("📱 KBZPay / WavePay / Banking", callback_data="pay_ONLINE")]
    ]
    await update.message.reply_text(
        "💳 <b>ငွေပေးချေမည့် ပုံစံကို ရွေးချယ်ပါ:</b>",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="HTML"
    )
    return CHECKOUT_PAYMENT

async def checkout_payment_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    pay_choice = query.data.split("_")[1]
    context.user_data["order_payment"] = pay_choice

    if pay_choice == "ONLINE":
        # Provide payment accounts info
        pay_info = (
            "📱 <b>ငွေလွှဲပေးရမည့် အကောင့်များ:</b>\n\n"
            "• <b>KBZPay:</b> 09-987654321 (U Mya)\n"
            "• <b>WavePay:</b> 09-987654321 (U Mya)\n"
            "• <b>AYA / CB Bank:</b> 0012345678901\n\n"
            "ငွေလွှဲပြီးပါက <b>ငွေလွှဲပြေစာ (Payment Slip / Screenshot)</b> ကို ပုံရိုက်ပို့ပေးပါ-"
        )
        await query.edit_message_text(pay_info, parse_mode="HTML")
        return CHECKOUT_SLIP
    else:
        # COD direct finalize
        return await finalize_order(update, context, slip_url=None)

async def checkout_slip_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    slip_url = None
    if update.message.photo:
        photo_file = await update.message.photo[-1].get_file()
        slip_url = photo_file.file_path
    elif update.message.document:
        doc_file = await update.message.document.get_file()
        slip_url = doc_file.file_path

    return await finalize_order(update, context, slip_url=slip_url)

async def finalize_order(update: Update, context: ContextTypes.DEFAULT_TYPE, slip_url=None):
    user = await get_or_create_user(update.effective_user)
    name = context.user_data.get("order_name", user.first_name or "Customer")
    phone = context.user_data.get("order_phone", "-")
    address = context.user_data.get("order_address", "-")
    payment = context.user_data.get("order_payment", "COD")
    order_code = f"ORD-{uuid.uuid4().hex[:8].upper()}"

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CartItem).options(selectinload(CartItem.product)).where(CartItem.user_id == user.id)
        )
        cart_items = result.scalars().all()

        if not cart_items:
            msg = "ခြင်းတောင်း ဗလာဖြစ်နေပါသဖြင့် အော်ဒါမတင်နိုင်ပါ။"
            if update.callback_query:
                await update.callback_query.message.reply_text(msg)
            else:
                await update.message.reply_text(msg)
            return ConversationHandler.END

        total_amount = sum(item.product.price * item.quantity for item in cart_items)

        order = Order(
            order_code=order_code,
            user_id=user.id,
            customer_name=name,
            customer_phone=phone,
            delivery_address=address,
            total_amount=total_amount,
            payment_method=payment,
            payment_slip_url=slip_url,
            status="Pending",
            created_at=datetime.datetime.utcnow()
        )
        session.add(order)
        await session.flush()

        for item in cart_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                product_name=item.product.name,
                price=item.product.price,
                quantity=item.quantity,
                subtotal=item.product.price * item.quantity
            )
            session.add(order_item)

        # Clear cart
        await session.execute(delete(CartItem).where(CartItem.user_id == user.id))
        await session.commit()

    success_text = (
        f"🎉 <b>အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်!</b>\n\n"
        f"🔖 <b>Order Code:</b> <code>{order_code}</code>\n"
        f"👤 <b>အမည်:</b> {name}\n"
        f"📞 <b>ဖုန်း:</b> {phone}\n"
        f"🏠 <b>လိပ်စာ:</b> {address}\n"
        f"💳 <b>ငွေပေးချေမှု:</b> {payment}\n"
        f"💵 <b>ကျသင့်ငွေ:</b> {total_amount:,.0f} MMK\n"
        f"⏳ <b>Status:</b> Pending (စစ်ဆေးဆဲ)\n\n"
        f"အော်ဒါကို ဆိုင်မှ အမြန်ဆုံး အတည်ပြုပေးပါမည်။ ကျေးဇူးတင်ရှိပါသည်! 🙏"
    )

    if update.callback_query:
        await update.callback_query.message.reply_text(success_text, reply_markup=get_main_keyboard(), parse_mode="HTML")
    else:
        await update.message.reply_text(success_text, reply_markup=get_main_keyboard(), parse_mode="HTML")

    context.user_data.clear()
    return ConversationHandler.END

async def checkout_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("အော်ဒါတင်ခြင်းကို ပယ်ဖျက်လိုက်ပါသည်။", reply_markup=get_main_keyboard())
    return ConversationHandler.END

async def my_orders_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = await get_or_create_user(update.effective_user)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc()).limit(5)
        )
        orders = result.scalars().all()

    if not orders:
        await update.message.reply_text("📦 သင်သည် အော်ဒါတင်ထားခြင်း မရှိသေးပါ။")
        return

    text = "📦 <b>သင်၏ နောက်ဆုံး အော်ဒါမှတ်တမ်းများ:</b>\n\n"
    status_emojis = {
        "Pending": "⏳",
        "Confirmed": "✅",
        "Shipped": "🚚",
        "Delivered": "🎉",
        "Cancelled": "❌"
    }

    for ord in orders:
        emoji = status_emojis.get(ord.status, "📌")
        text += (
            f"🔖 <b>Code:</b> <code>{ord.order_code}</code>\n"
            f"📅 <b>Date:</b> {ord.created_at.strftime('%Y-%m-%d %H:%M')}\n"
            f"💵 <b>Amount:</b> {ord.total_amount:,.0f} MMK\n"
            f"🔄 <b>Status:</b> {emoji} {ord.status}\n"
            f"────────────────────\n"
        )

    await update.message.reply_text(text, parse_mode="HTML")

def register_shop_handlers(app: Application):
    # Main menu buttons
    app.add_handler(MessageHandler(filters.Regex("^🛍️ ကုန်ပစ္စည်းများ \(Shop\)$"), show_categories))
    app.add_handler(MessageHandler(filters.Regex("^🛒 ခြင်းတောင်း \(Cart\)$"), view_cart))
    app.add_handler(MessageHandler(filters.Regex("^📦 My Orders$"), my_orders_handler))

    # Inline callbacks
    app.add_handler(CallbackQueryHandler(show_categories, pattern="^back_categories$"))
    app.add_handler(CallbackQueryHandler(view_cart, pattern="^view_cart$"))
    app.add_handler(CallbackQueryHandler(category_callback, pattern="^cat_"))
    app.add_handler(CallbackQueryHandler(product_detail_callback, pattern="^prod_"))
    app.add_handler(CallbackQueryHandler(add_to_cart_callback, pattern="^add_cart_"))
    app.add_handler(CallbackQueryHandler(clear_cart_callback, pattern="^clear_cart$"))

    # Checkout Conversation
    checkout_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(checkout_start, pattern="^start_checkout$")],
        states={
            CHECKOUT_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, checkout_name_step)],
            CHECKOUT_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, checkout_phone_step)],
            CHECKOUT_ADDRESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, checkout_address_step)],
            CHECKOUT_PAYMENT: [CallbackQueryHandler(checkout_payment_step, pattern="^pay_")],
            CHECKOUT_SLIP: [
                MessageHandler(filters.PHOTO | filters.Document.ALL, checkout_slip_step),
                MessageHandler(filters.TEXT & ~filters.COMMAND, checkout_slip_step)
            ]
        },
        fallbacks=[CommandHandler("cancel", checkout_cancel)]
    )
    app.add_handler(checkout_conv)
