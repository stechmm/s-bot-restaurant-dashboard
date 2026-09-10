import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import BotUser, Order, ChatMessage, Product
from app.routers.deps import get_store_id

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])

@router.get("/overview")
async def get_overview_stats(
    store_id: Optional[int] = Depends(get_store_id),
    db: AsyncSession = Depends(get_db)
):
    # Base filters
    user_q = select(func.count(BotUser.id))
    order_q = select(func.count(Order.id))
    rev_q = select(func.sum(Order.total_amount)).where(Order.status.in_(["Confirmed", "Cooking", "Out for Delivery", "Delivered"]))
    pending_q = select(func.count(Order.id)).where(Order.status == "Pending")
    unread_q = select(func.count(ChatMessage.id)).where(ChatMessage.sender == "user", ChatMessage.is_read == False)
    prod_q = select(func.count(Product.id))
    recent_q = select(Order).order_by(Order.created_at.desc()).limit(5)

    if store_id is not None:
        user_q = user_q.where(BotUser.store_id == store_id)
        order_q = order_q.where(Order.store_id == store_id)
        rev_q = rev_q.where(Order.store_id == store_id)
        pending_q = pending_q.where(Order.store_id == store_id)
        unread_q = unread_q.where(ChatMessage.store_id == store_id)
        prod_q = prod_q.where(Product.store_id == store_id)
        recent_q = recent_q.where(Order.store_id == store_id)

    users_count = await db.scalar(user_q) or 0
    orders_count = await db.scalar(order_q) or 0
    total_revenue = await db.scalar(rev_q) or 0.0
    pending_orders = await db.scalar(pending_q) or 0
    unread_messages = await db.scalar(unread_q) or 0
    products_count = await db.scalar(prod_q) or 0

    recent_orders_res = await db.execute(recent_q)
    recent_orders = [
        {
            "id": o.id,
            "order_code": o.order_code,
            "customer_name": o.customer_name,
            "customer_phone": o.customer_phone,
            "total_amount": o.total_amount,
            "status": o.status,
            "created_at": o.created_at.isoformat()
        } for o in recent_orders_res.scalars().all()
    ]

    # Daily Chart Data (Past 7 days)
    today = datetime.date.today()
    chart_data = []
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        next_day = day + datetime.timedelta(days=1)
        
        day_user_q = select(func.count(BotUser.id)).where(
            BotUser.created_at >= datetime.datetime.combine(day, datetime.time.min),
            BotUser.created_at < datetime.datetime.combine(next_day, datetime.time.min)
        )
        day_rev_q = select(func.sum(Order.total_amount)).where(
            Order.created_at >= datetime.datetime.combine(day, datetime.time.min),
            Order.created_at < datetime.datetime.combine(next_day, datetime.time.min),
            Order.status != "Cancelled"
        )
        if store_id is not None:
            day_user_q = day_user_q.where(BotUser.store_id == store_id)
            day_rev_q = day_rev_q.where(Order.store_id == store_id)

        day_users = await db.scalar(day_user_q) or 0
        day_revenue = await db.scalar(day_rev_q) or 0.0

        chart_data.append({
            "date": day.strftime("%b %d"),
            "new_users": day_users,
            "sales": float(day_revenue)
        })

    return {
        "total_users": users_count,
        "total_orders": orders_count,
        "total_revenue": total_revenue,
        "pending_orders": pending_orders,
        "unread_messages": unread_messages,
        "total_products": products_count,
        "recent_orders": recent_orders,
        "chart_data": chart_data
    }
