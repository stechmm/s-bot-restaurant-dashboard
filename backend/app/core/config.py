import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "S-Bot Restaurant & Admin Dashboard"
    DATABASE_URL: str = "sqlite+aiosqlite:///./data.db"
    SYNC_DATABASE_URL: str = "sqlite:///./data.db"
    SECRET_KEY: str = "super-secret-key-change-in-production-12345"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    
    # Bot Settings
    TELEGRAM_BOT_TOKEN: str = ""
    CURRENCY: str = "MMK"
    STORE_NAME: str = "S-Bot Restaurant & Cafe"
    SUPPORT_NOTIFICATION_CHAT_ID: str = ""
    ADMIN_TELEGRAM_ID: str = ""  # Admin's Telegram User ID for order alerts
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
