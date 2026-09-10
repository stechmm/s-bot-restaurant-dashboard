import logging
from sqlalchemy import text
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.store import Store
from app.core.config import settings

logger = logging.getLogger("migration")

async def init_and_migrate_db():
    """Initializes tables, adds missing multi-tenant columns to SQLite, and seeds default Store."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Ensure 'store_id' columns exist in SQLite tables if migrating from earlier single-tenant db
        tables_to_check = [
            "categories", "products", "orders", "bot_users", 
            "chat_messages", "news_posts", "broadcast_logs", "faqs", 
            "coupons", "reviews"
        ]
        
        for table in tables_to_check:
            try:
                await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN store_id INTEGER DEFAULT 1"))
                logger.info(f"Added store_id column to {table}")
            except Exception:
                # Column already exists
                pass

    # Seed initial default store if none exists
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        res = await session.execute(select(Store))
        first_store = res.scalars().first()
        
        if not first_store:
            logger.info("No store found. Seeding default initial store (Pandora Food House)...")
            default_store = Store(
                id=1,
                name=settings.STORE_NAME or "Pandora Food House",
                business_type="restaurant",
                bot_token=settings.TELEGRAM_BOT_TOKEN or "8975198229:AAFAv7ilmqbGlvew-ZEHBCNavwm5FSu18gM",
                bot_username="@pandorafoodbot",
                currency=settings.CURRENCY or "MMK",
                admin_telegram_id=settings.ADMIN_TELEGRAM_ID or "",
                support_chat_id=settings.SUPPORT_NOTIFICATION_CHAT_ID or "",
                is_active=True
            )
            session.add(default_store)
            await session.commit()
            logger.info("Default store created with ID 1.")
        
        # Ensure any orphan records have store_id = 1
        for table in tables_to_check:
            try:
                await session.execute(text(f"UPDATE {table} SET store_id = 1 WHERE store_id IS NULL"))
            except Exception:
                pass
        await session.commit()
