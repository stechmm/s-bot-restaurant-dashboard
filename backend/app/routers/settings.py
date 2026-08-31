from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import AppSetting, FAQ, BotUser
from app.schemas.schemas import FAQBase, FAQCreate, FAQOut, BotUserOut
from app.bot.bot_service import bot_service
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["Settings & FAQs"])

class SettingsUpdate(BaseModel):
    bot_token: Optional[str] = None
    store_name: Optional[str] = None
    currency: Optional[str] = None
    kpay_number: Optional[str] = None
    wavepay_number: Optional[str] = None

@router.get("/")
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AppSetting))
    settings_dict = {s.key: s.value for s in result.scalars().all()}
    
    return {
        "bot_is_running": bot_service.is_running,
        "bot_token_masked": (settings_dict.get("TELEGRAM_BOT_TOKEN", "")[:8] + "..." + settings_dict.get("TELEGRAM_BOT_TOKEN", "")[-4:]) if settings_dict.get("TELEGRAM_BOT_TOKEN") else "",
        "store_name": settings_dict.get("STORE_NAME", "Omni Store"),
        "currency": settings_dict.get("CURRENCY", "MMK"),
        "kpay_number": settings_dict.get("KPAY_NUMBER", "09-987654321"),
        "wavepay_number": settings_dict.get("WAVEPAY_NUMBER", "09-987654321")
    }

@router.post("/")
async def update_settings(payload: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    async def set_or_update(key: str, val: Optional[str]):
        if val is not None:
            res = await db.execute(select(AppSetting).where(AppSetting.key == key))
            setting = res.scalar_one_or_none()
            if not setting:
                setting = AppSetting(key=key, value=val)
                db.add(setting)
            else:
                setting.value = val

    if payload.bot_token:
        await set_or_update("TELEGRAM_BOT_TOKEN", payload.bot_token)
    if payload.store_name:
        await set_or_update("STORE_NAME", payload.store_name)
    if payload.currency:
        await set_or_update("CURRENCY", payload.currency)
    if payload.kpay_number:
        await set_or_update("KPAY_NUMBER", payload.kpay_number)
    if payload.wavepay_number:
        await set_or_update("WAVEPAY_NUMBER", payload.wavepay_number)

    await db.commit()

    # If bot token updated, attempt to restart bot
    if payload.bot_token:
        await bot_service.stop()
        started = await bot_service.start()
        return {"message": "Settings saved. Bot restarted.", "bot_running": started}

    return {"message": "Settings saved successfully"}

@router.post("/bot/start")
async def start_bot():
    started = await bot_service.start()
    if not started:
        raise HTTPException(status_code=400, detail="Bot ကို စတင်၍ မရပါ။ ကျေးဇူးပြု၍ Bot Token မှန်ကန်မှု ရှိမရှိ စစ်ဆေးပါ။")
    return {"message": "Bot started successfully", "bot_running": True}

@router.post("/bot/stop")
async def stop_bot():
    await bot_service.stop()
    return {"message": "Bot stopped successfully", "bot_running": False}

# --- FAQ CRUD ---
@router.get("/faqs", response_model=List[FAQOut])
async def list_faqs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FAQ).order_by(FAQ.order_index))
    return result.scalars().all()

@router.post("/faqs", response_model=FAQOut)
async def create_faq(payload: FAQCreate, db: AsyncSession = Depends(get_db)):
    faq = FAQ(**payload.model_dump())
    db.add(faq)
    await db.commit()
    await db.refresh(faq)
    return faq

@router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FAQ).where(FAQ.id == faq_id))
    faq = result.scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    await db.delete(faq)
    await db.commit()
    return {"message": "FAQ deleted successfully"}

# --- Users Directory ---
@router.get("/users", response_model=List[BotUserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BotUser).order_by(BotUser.last_active.desc()))
    return result.scalars().all()

@router.post("/users/{user_id}/toggle-block")
async def toggle_block_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BotUser).where(BotUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_blocked = not user.is_blocked
    await db.commit()
    return {"user_id": user.id, "is_blocked": user.is_blocked}
