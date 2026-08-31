import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import BotUser, Order, ChatMessage, Product

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])

@router.get("/overview")
async def get_overview_stats(db: AsyncSession = Depends(get_db)):
    # Total Users
    users_count = await db.scalar(select(func.count(BotUser.id))) or 0

    # Total Orders & Revenue
    orders_count = await db.scalar(select(func.count(Order.id))) or 0
    total_revenue = await db.scalar(
        select(func.sum(Order.total_amount)).where(Order.status.in_(["Confirmed", "Shipped", "Delivered"]))
    ) or 0.0

    # Pending Orders
    pending_orders = await db.scalar(select(func.count(Order.id)).where(Order.status == "Pending")) or 0

    # Unread Support Messages
    unread_messages = await db.scalar(
        select(func.count(ChatMessage.id)).where(ChatMessage.sender == "user", ChatMessage.is_read == False)
    ) or 0

    # Total Products
    products_count = await db.scalar(select(func.count(Product.id))) or 0

    # Recent 5 Orders
    recent_orders_res = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(5)
    )
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
        
        day_users = await db.scalar(
            select(func.count(BotUser.id)).where(
                BotUser.created_at >= datetime.datetime.combine(day, datetime.time.min),
                BotUser.created_at < datetime.datetime.combine(next_day, datetime.time.min)
            )
        ) or 0
        
        day_revenue = await db.scalar(
            select(func.sum(Order.total_amount)).where(
                Order.created_at >= datetime.datetime.combine(day, datetime.time.min),
                Order.created_at < datetime.datetime.combine(next_day, datetime.time.min),
                Order.status != "Cancelled"
            )
        ) or 0.0

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
