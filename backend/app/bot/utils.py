import datetime
from typing import Optional
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.models import BotUser
from telegram import ReplyKeyboardMarkup, KeyboardButton

def get_main_keyboard():
    keyboard = [
        [KeyboardButton("🛍️ ကုန်ပစ္စည်းများ (Shop)"), KeyboardButton("🛒 ခြင်းတောင်း (Cart)")],
        [KeyboardButton("💬 Customer Support"), KeyboardButton("📰 သတင်းများ (News)")],
        [KeyboardButton("📦 My Orders"), KeyboardButton("ℹ️ ဆိုင်အချက်အလက် (About)")]
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

async def get_or_create_user(tg_user, store_id: Optional[int] = 1) -> BotUser:
    actual_store_id = store_id or 1
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(BotUser).where(
                BotUser.telegram_id == tg_user.id,
                BotUser.store_id == actual_store_id
            )
        )
        user = result.scalar_one_or_none()
        if not user:
            user = BotUser(
                store_id=actual_store_id,
                telegram_id=tg_user.id,
                username=tg_user.username,
                first_name=tg_user.first_name,
                last_name=tg_user.last_name,
                created_at=datetime.datetime.utcnow(),
                last_active=datetime.datetime.utcnow()
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        else:
            user.last_active = datetime.datetime.utcnow()
            user.username = tg_user.username or user.username
            user.first_name = tg_user.first_name or user.first_name
            user.last_name = tg_user.last_name or user.last_name
            await session.commit()
            await session.refresh(user)
        return user
