import asyncio
import logging
from typing import Optional
from telegram import Update, Bot
from telegram.request import HTTPXRequest
from telegram.ext import Application, ApplicationBuilder, CommandHandler, CallbackQueryHandler, MessageHandler, filters
from app.core.config import settings

logger = logging.getLogger("telegram_bot")

class BotService:
    def __init__(self):
        self.app: Optional[Application] = None
        self.is_running: bool = False
        self.token: str = settings.TELEGRAM_BOT_TOKEN
        self._task: Optional[asyncio.Task] = None

    async def get_active_token(self) -> str:
        # Check from DB settings or fallback to config
        from app.core.database import AsyncSessionLocal
        from app.models.models import AppSetting
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(AppSetting).where(AppSetting.key == "TELEGRAM_BOT_TOKEN"))
            setting = result.scalar_one_or_none()
            if setting and setting.value:
                return setting.value.strip()
        return self.token or settings.TELEGRAM_BOT_TOKEN

    async def start(self):
        token = await self.get_active_token()
        if not token:
            logger.warning("Telegram Bot Token is not set. Bot will not start automatically.")
            self.is_running = False
            return False

        try:
            if self.is_running and self.app:
                await self.stop()

            logger.info("Initializing Telegram Bot with robust timeout...")
            
            # Setup HTTPX Request with generous timeouts for Myanmar network latency
            req = HTTPXRequest(
                connect_timeout=30.0,
                read_timeout=30.0,
                write_timeout=30.0,
                pool_timeout=30.0
            )

            builder = ApplicationBuilder().token(token).request(req)
            self.app = builder.build()

            # Register Handlers
            from app.bot.handlers.start import register_start_handlers
            from app.bot.handlers.shop import register_shop_handlers
            from app.bot.handlers.support import register_support_handlers
            from app.bot.handlers.news import register_news_handlers

            register_start_handlers(self.app)
            register_shop_handlers(self.app)
            register_support_handlers(self.app)
            register_news_handlers(self.app)

            await self.app.initialize()
            
            # Clear any old webhook from previous apps if exists
            try:
                await self.app.bot.delete_webhook(drop_pending_updates=True)
            except Exception as w_err:
                logger.warning(f"delete_webhook notice: {w_err}")

            await self.app.start()
            await self.app.updater.start_polling(drop_pending_updates=True)
            self.is_running = True
            logger.info("Telegram Bot started polling successfully!")
            return True
        except Exception as e:
            logger.error(f"Failed to start Telegram Bot: {e}")
            self.is_running = False
            return False

    async def stop(self):
        if self.app and self.is_running:
            try:
                logger.info("Stopping Telegram Bot...")
                if self.app.updater:
                    await self.app.updater.stop()
                await self.app.stop()
                await self.app.shutdown()
                self.is_running = False
                logger.info("Telegram Bot stopped.")
            except Exception as e:
                logger.error(f"Error stopping bot: {e}")
                self.is_running = False

    async def send_message_to_user(self, telegram_id: int, text: str, image_url: Optional[str] = None):
        token = await self.get_active_token()
        if not token:
            return False, "Bot token not configured"
        try:
            req = HTTPXRequest(connect_timeout=30.0, read_timeout=30.0)
            bot = Bot(token=token, request=req)
            if image_url:
                await bot.send_photo(chat_id=telegram_id, photo=image_url, caption=text, parse_mode="HTML")
            else:
                await bot.send_message(chat_id=telegram_id, text=text, parse_mode="HTML")
            return True, "Success"
        except Exception as e:
            logger.error(f"Error sending message to {telegram_id}: {e}")
            return False, str(e)

    async def broadcast_message(self, telegram_ids: list[int], text: str, image_url: Optional[str] = None, button_text: Optional[str] = None, button_url: Optional[str] = None):
        token = await self.get_active_token()
        if not token:
            return {"success": 0, "fail": len(telegram_ids), "error": "Bot token not configured"}
        
        req = HTTPXRequest(connect_timeout=30.0, read_timeout=30.0)
        bot = Bot(token=token, request=req)
        from telegram import InlineKeyboardButton, InlineKeyboardMarkup
        reply_markup = None
        if button_text and button_url:
            reply_markup = InlineKeyboardMarkup([[InlineKeyboardButton(text=button_text, url=button_url)]])

        success_count = 0
        fail_count = 0

        for tg_id in telegram_ids:
            try:
                if image_url:
                    await bot.send_photo(chat_id=tg_id, photo=image_url, caption=text, parse_mode="HTML", reply_markup=reply_markup)
                else:
                    await bot.send_message(chat_id=tg_id, text=text, parse_mode="HTML", reply_markup=reply_markup)
                success_count += 1
                await asyncio.sleep(0.05)
            except Exception as e:
                logger.warning(f"Failed broadcast to {tg_id}: {e}")
                fail_count += 1

        return {"success": success_count, "fail": fail_count}

bot_service = BotService()
