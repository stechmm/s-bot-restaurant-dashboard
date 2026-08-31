import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import BotUser, NewsPost, BroadcastLog
from app.schemas.schemas import NewsPostCreate, NewsPostOut, BroadcastRequest
from app.bot.bot_service import bot_service

router = APIRouter(prefix="/broadcast", tags=["News & Broadcasts"])

# --- News Posts ---
@router.get("/news", response_model=List[NewsPostOut])
async def list_news(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NewsPost).order_by(NewsPost.created_at.desc()))
    return result.scalars().all()

@router.post("/news", response_model=NewsPostOut)
async def create_news(payload: NewsPostCreate, db: AsyncSession = Depends(get_db)):
    post = NewsPost(**payload.model_dump())
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post

@router.delete("/news/{news_id}")
async def delete_news(news_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NewsPost).where(NewsPost.id == news_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="News post not found")
    await db.delete(post)
    await db.commit()
    return {"message": "News deleted successfully"}

# --- Broadcast Message to all Bot Users ---
@router.post("/send")
async def send_broadcast(payload: BroadcastRequest, db: AsyncSession = Depends(get_db)):
    # Fetch all active bot users telegram_ids
    result = await db.execute(select(BotUser.telegram_id).where(BotUser.is_blocked == False))
    tg_ids = result.scalars().all()

    if not tg_ids:
        raise HTTPException(status_code=400, detail="Bot အသုံးပြုသူ တစ်ဦးမျှ မရှိသေးပါ။ (No subscribers)")

    res = await bot_service.broadcast_message(
        telegram_ids=list(tg_ids),
        text=payload.message_text,
        image_url=payload.image_url,
        button_text=payload.button_text,
        button_url=payload.button_url
    )

    # Save log
    log = BroadcastLog(
        message_text=payload.message_text,
        image_url=payload.image_url,
        total_sent=len(tg_ids),
        success_count=res.get("success", 0),
        fail_count=res.get("fail", 0),
        created_at=datetime.datetime.utcnow()
    )
    db.add(log)
    await db.commit()

    return {
        "message": "Broadcast completed",
        "total": len(tg_ids),
        "success": res.get("success", 0),
        "fail": res.get("fail", 0)
    }

@router.get("/logs")
async def get_broadcast_logs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BroadcastLog).order_by(BroadcastLog.created_at.desc()).limit(20))
    return result.scalars().all()
