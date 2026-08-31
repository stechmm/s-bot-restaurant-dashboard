import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import engine, Base
from app.bot.bot_service import bot_service

# Routers
from app.routers import auth, stats, products, orders, support, broadcast, settings as app_settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Auto start Telegram Bot if token configured
    try:
        await bot_service.start()
    except Exception as e:
        print(f"Bot auto-start notice: {e}")

    yield

    # Shutdown: Stop bot
    await bot_service.stop()

app = FastAPI(
    title="Restaurant Telegram Bot & Admin Dashboard API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(support.router, prefix="/api")
app.include_router(broadcast.router, prefix="/api")
app.include_router(app_settings.router, prefix="/api")

# Serve Frontend Production Build if exists
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    # Mount assets
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # SPA Fallback route
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "online", "message": "Restaurant Backend API is running"}
else:
    @app.get("/")
    async def root():
        return {
            "status": "online",
            "service": "Restaurant Telegram Bot & Admin Dashboard Backend",
            "bot_active": bot_service.is_running
        }
