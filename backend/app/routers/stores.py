import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.store import Store
from app.models.models import Product, Order
from app.bot.multi_bot_manager import multi_bot_manager

logger = logging.getLogger("stores_router")
router = APIRouter(prefix="/stores", tags=["Stores"])

class StoreCreate(BaseModel):
    name: str
    business_type: str = "restaurant" # restaurant, retail, service, general
    bot_token: Optional[str] = ""
    bot_username: Optional[str] = ""
    currency: str = "MMK"
    description: Optional[str] = ""
    admin_telegram_id: Optional[str] = ""
    support_chat_id: Optional[str] = ""
    is_active: bool = True

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    bot_token: Optional[str] = None
    bot_username: Optional[str] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    admin_telegram_id: Optional[str] = None
    support_chat_id: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("/")
async def list_stores():
    """Lists all stores with live bot status, product and order metrics."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Store).order_by(Store.id))
        stores = result.scalars().all()

        store_list = []
        for s in stores:
            # Count products
            prod_res = await session.execute(
                select(func.count(Product.id)).where(Product.store_id == s.id)
            )
            products_count = prod_res.scalar() or 0

            # Count orders & revenue
            ord_res = await session.execute(
                select(
                    func.count(Order.id),
                    func.coalesce(func.sum(Order.total_amount), 0)
                ).where(Order.store_id == s.id)
            )
            orders_count, total_revenue = ord_res.one()

            # Mask bot token for display
            token_masked = ""
            if s.bot_token and len(s.bot_token) > 10:
                token_masked = f"{s.bot_token[:8]}...{s.bot_token[-4:]}"

            store_list.append({
                "id": s.id,
                "name": s.name,
                "business_type": s.business_type,
                "bot_token": s.bot_token or "",
                "bot_token_masked": token_masked,
                "bot_username": s.bot_username or "",
                "currency": s.currency,
                "description": s.description or "",
                "admin_telegram_id": s.admin_telegram_id or "",
                "support_chat_id": s.support_chat_id or "",
                "is_active": s.is_active,
                "created_at": s.created_at,
                "bot_is_running": multi_bot_manager.is_running(s.id),
                "products_count": products_count,
                "orders_count": orders_count,
                "total_revenue": total_revenue
            })

    return store_list

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_store(payload: StoreCreate):
    """Creates a new store/business and automatically boots its Telegram Bot if token is provided."""
    async with AsyncSessionLocal() as session:
        new_store = Store(
            name=payload.name.strip(),
            business_type=payload.business_type,
            bot_token=payload.bot_token.strip() if payload.bot_token else "",
            bot_username=payload.bot_username.strip() if payload.bot_username else "",
            currency=payload.currency.strip() or "MMK",
            description=payload.description or "",
            admin_telegram_id=payload.admin_telegram_id or "",
            support_chat_id=payload.support_chat_id or "",
            is_active=payload.is_active
        )
        session.add(new_store)
        await session.commit()
        await session.refresh(new_store)

    # Auto-seed starter categories based on business type
    DEFAULT_CATEGORIES_BY_TYPE = {
        "restaurant": [
            ("အဓိက ဟင်းလျာများ", "🍲", "Main Dishes & Rice"),
            ("အကြော်နှင့် အမြည်းများ", "🍢", "Snacks & Appetizers"),
            ("အဖျော်ယမကာနှင့် အအေး", "🥤", "Beverages & Drinks"),
            ("အချိုပွဲများ", "🍨", "Desserts & Sweets")
        ],
        "retail": [
            ("အမျိုးသား ဝတ်စုံများ", "👔", "Men's Fashion & Wear"),
            ("အမျိုးသမီး ဝတ်စုံများ", "👗", "Women's Fashion & Dresses"),
            ("ဖိနပ်နှင့် အိတ်များ", "👠", "Shoes & Bags"),
            ("အလှကုန်နှင့် အသုံးအဆောင်", "💄", "Cosmetics & Accessories")
        ],
        "service": [
            ("ဝန်ဆောင်မှု ပက်ကေ့ခ်ျများ", "⭐", "Service Packages"),
            ("အထူး လျှော့စျေး အစီအစဉ်", "🏷️", "Special Promotions")
        ],
        "general": [
            ("လူကြိုက်များသော ပစ္စည်းများ", "🔥", "Best Sellers"),
            ("ကုန်ပစ္စည်း အသစ်များ", "✨", "New Arrivals")
        ]
    }

    async with AsyncSessionLocal() as cat_session:
        from app.models.models import Category
        cats_to_create = DEFAULT_CATEGORIES_BY_TYPE.get(new_store.business_type, DEFAULT_CATEGORIES_BY_TYPE["general"])
        for cat_name, cat_icon, cat_desc in cats_to_create:
            cat_session.add(Category(
                store_id=new_store.id,
                name=cat_name,
                icon=cat_icon,
                description=cat_desc,
                is_active=True
            ))
        await cat_session.commit()

    # If bot token provided and active, start the bot instance
    if new_store.is_active and new_store.bot_token:
        try:
            await multi_bot_manager.start_bot(new_store)
        except Exception as e:
            logger.warning(f"Failed to auto-start bot for new store #{new_store.id}: {e}")

    return {
        "message": f"Store '{new_store.name}' created successfully!",
        "store_id": new_store.id,
        "bot_is_running": multi_bot_manager.is_running(new_store.id)
    }

@router.get("/{store_id}")
async def get_store(store_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Store).where(Store.id == store_id))
        store = result.scalar_one_or_none()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        return {
            "id": store.id,
            "name": store.name,
            "business_type": store.business_type,
            "bot_token": store.bot_token or "",
            "bot_username": store.bot_username or "",
            "currency": store.currency,
            "description": store.description or "",
            "admin_telegram_id": store.admin_telegram_id or "",
            "support_chat_id": store.support_chat_id or "",
            "is_active": store.is_active,
            "created_at": store.created_at,
            "bot_is_running": multi_bot_manager.is_running(store.id)
        }

@router.put("/{store_id}")
async def update_store(store_id: int, payload: StoreUpdate):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Store).where(Store.id == store_id))
        store = result.scalar_one_or_none()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        prev_token = store.bot_token
        prev_active = store.is_active

        if payload.name is not None:
            store.name = payload.name.strip()
        if payload.business_type is not None:
            store.business_type = payload.business_type
        if payload.bot_token is not None:
            store.bot_token = payload.bot_token.strip()
        if payload.bot_username is not None:
            store.bot_username = payload.bot_username.strip()
        if payload.currency is not None:
            store.currency = payload.currency.strip()
        if payload.description is not None:
            store.description = payload.description
        if payload.admin_telegram_id is not None:
            store.admin_telegram_id = payload.admin_telegram_id.strip()
        if payload.support_chat_id is not None:
            store.support_chat_id = payload.support_chat_id.strip()
        if payload.is_active is not None:
            store.is_active = payload.is_active

        await session.commit()
        await session.refresh(store)

    # Handle bot restart / stop if token or active status changed
    token_changed = prev_token != store.bot_token
    active_changed = prev_active != store.is_active

    if token_changed or active_changed:
        if store.is_active and store.bot_token:
            await multi_bot_manager.restart_bot(store.id)
        else:
            await multi_bot_manager.stop_bot(store.id)

    return {
        "message": f"Store '{store.name}' updated successfully!",
        "bot_is_running": multi_bot_manager.is_running(store.id)
    }

@router.delete("/{store_id}")
async def delete_store(store_id: int):
    # Stop bot first
    await multi_bot_manager.stop_bot(store_id)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Store).where(Store.id == store_id))
        store = result.scalar_one_or_none()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        await session.delete(store)
        await session.commit()

    return {"message": f"Store #{store_id} deleted successfully."}

@router.post("/{store_id}/bot/start")
async def start_store_bot(store_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Store).where(Store.id == store_id))
        store = result.scalar_one_or_none()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")
        if not store.bot_token:
            raise HTTPException(status_code=400, detail="Store does not have a Telegram Bot token configured")

        success = await multi_bot_manager.start_bot(store)
        if success:
            return {"status": "started", "bot_is_running": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to start Telegram Bot")

@router.post("/{store_id}/bot/stop")
async def stop_store_bot(store_id: int):
    success = await multi_bot_manager.stop_bot(store_id)
    return {"status": "stopped", "bot_is_running": False}

@router.post("/{store_id}/bot/restart")
async def restart_store_bot(store_id: int):
    success = await multi_bot_manager.restart_bot(store_id)
    return {"status": "restarted", "bot_is_running": multi_bot_manager.is_running(store_id)}
