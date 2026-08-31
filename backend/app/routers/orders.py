from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import Order, BotUser
from app.schemas.schemas import OrderOut, OrderStatusUpdate
from app.bot.bot_service import bot_service

router = APIRouter(prefix="/orders", tags=["Orders Management"])

@router.get("/", response_model=List[OrderOut])
async def list_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
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

    # If linked to a Telegram user and notify_user is True, send update message via bot
    if notify_user and order.user_id:
        user_res = await db.execute(select(BotUser).where(BotUser.id == order.user_id))
        user = user_res.scalar_one_or_none()
        if user and user.telegram_id:
            status_emojis = {
                "Pending": "⏳",
                "Confirmed": "✅",
                "Shipped": "🚚",
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

            await bot_service.send_message_to_user(user.telegram_id, notify_text)

    return order
