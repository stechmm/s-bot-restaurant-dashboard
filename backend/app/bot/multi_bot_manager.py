import asyncio
import logging
from typing import Dict, Optional, Any
from telegram.request import HTTPXRequest
from telegram.ext import Application, ApplicationBuilder
from app.core.database import AsyncSessionLocal
from app.models.store import Store
from sqlalchemy import select

logger = logging.getLogger("multi_bot_manager")

class MultiBotManager:
    def __init__(self):
        self.active_bots: Dict[int, Application] = {}

    def is_running(self, store_id: int) -> bool:
        return store_id in self.active_bots

    def get_bot(self, store_id: int) -> Optional[Application]:
        return self.active_bots.get(store_id)

    async def start_bot(self, store: Store) -> bool:
        if not store.bot_token:
            logger.warning(f"Store #{store.id} ({store.name}) has no bot token configured.")
            return False

        # Stop existing instance if already running
        if store.id in self.active_bots:
            await self.stop_bot(store.id)

        try:
            logger.info(f"Starting bot for Store #{store.id}: {store.name}...")
            
            # Setup HTTPX Request with generous timeouts for Myanmar network latency
            req = HTTPXRequest(
                connect_timeout=30.0,
                read_timeout=30.0,
                write_timeout=30.0,
                pool_timeout=30.0
            )

            builder = ApplicationBuilder().token(store.bot_token.strip()).request(req)
            app = builder.build()

            # Store multi-tenant metadata inside bot_data
            app.bot_data["store_id"] = store.id
            app.bot_data["store_name"] = store.name
            app.bot_data["business_type"] = store.business_type or "restaurant"
            app.bot_data["currency"] = store.currency or "MMK"
            app.bot_data["admin_telegram_id"] = store.admin_telegram_id or ""
            app.bot_data["support_chat_id"] = store.support_chat_id or ""

            # Register Handlers
            from app.bot.handlers.start import register_start_handlers
            from app.bot.handlers.shop import register_shop_handlers
            from app.bot.handlers.support import register_support_handlers
            from app.bot.handlers.news import register_news_handlers
            from app.bot.handlers.review import register_review_handlers

            register_start_handlers(app)
            register_shop_handlers(app)
            register_support_handlers(app)
            register_news_handlers(app)
            register_review_handlers(app)

            await app.initialize()

            # Clear any old webhook to allow clean polling
            try:
                await app.bot.delete_webhook(drop_pending_updates=True)
            except Exception as w_err:
                logger.warning(f"delete_webhook notice for Store #{store.id}: {w_err}")

            await app.start()
            await app.updater.start_polling(drop_pending_updates=True)

            self.active_bots[store.id] = app
            logger.info(f"Bot for Store #{store.id} ({store.name}) started successfully!")
            return True
        except Exception as e:
            logger.error(f"Failed to start bot for Store #{store.id}: {e}")
            return False

    async def stop_bot(self, store_id: int) -> bool:
        if store_id not in self.active_bots:
            return True

        app = self.active_bots[store_id]
        try:
            logger.info(f"Stopping bot for Store #{store_id}...")
            if app.updater:
                await app.updater.stop()
            await app.stop()
            await app.shutdown()
            del self.active_bots[store_id]
            logger.info(f"Bot for Store #{store_id} stopped.")
            return True
        except Exception as e:
            logger.error(f"Error stopping bot for Store #{store_id}: {e}")
            if store_id in self.active_bots:
                del self.active_bots[store_id]
            return False

    async def restart_bot(self, store_id: int) -> bool:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Store).where(Store.id == store_id))
            store = result.scalar_one_or_none()
            if not store:
                return False
            await self.stop_bot(store_id)
            if store.is_active:
                return await self.start_bot(store)
            return True

    async def start_all(self):
        """Starts all active stores with configured bot tokens concurrently."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Store).where(Store.is_active == True, Store.bot_token != None)
            )
            stores = result.scalars().all()

        logger.info(f"MultiBotManager: Found {len(stores)} active store(s) to start.")
        for store in stores:
            if store.bot_token and store.bot_token.strip():
                try:
                    await self.start_bot(store)
                except Exception as e:
                    logger.error(f"Error auto-starting store #{store.id}: {e}")

    async def stop_all(self):
        """Clean shutdown of all active bot instances."""
        logger.info("MultiBotManager: Stopping all active bot instances...")
        store_ids = list(self.active_bots.keys())
        for store_id in store_ids:
            try:
                await self.stop_bot(store_id)
            except Exception as e:
                logger.error(f"Error during stop_all for Store #{store_id}: {e}")

# Global Singleton Instance
multi_bot_manager = MultiBotManager()
