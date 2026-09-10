import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.migration import init_and_migrate_db
from app.bot.multi_bot_manager import multi_bot_manager
from app.bot.scheduler import start_scheduler, stop_scheduler

# Import all models so SQLAlchemy metadata is aware of all tables
from app.models import store, models, coupon, review

# Routers
from app.routers import (
    auth, stats, products, orders, support, broadcast, 
    settings as app_settings, coupons, reviews, stores
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables, migrate columns, seed default store
    try:
        await init_and_migrate_db()
    except Exception as e:
        print(f"Migration/Init notice: {e}")

    # Auto start all active Telegram Bots concurrently
    try:
        await multi_bot_manager.start_all()
    except Exception as e:
        print(f"MultiBotManager auto-start notice: {e}")

    # Start daily report scheduler
    try:
        start_scheduler()
    except Exception as e:
        print(f"Scheduler start notice: {e}")

    yield

    # Shutdown: Stop all bots and scheduler
    await multi_bot_manager.stop_all()
    stop_scheduler()

app = FastAPI(
    title="Multi-Bot Restaurant & Business Control Center API",
    version="2.0.0",
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
app.include_router(stores.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(support.router, prefix="/api")
app.include_router(broadcast.router, prefix="/api")
app.include_router(app_settings.router, prefix="/api")
app.include_router(coupons.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")

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
        return {"status": "online", "message": "Multi-Bot Platform Backend API is running"}
else:
    @app.get("/")
    async def root():
        return {
            "status": "online",
            "service": "Multi-Bot Platform Backend API",
            "active_bots_count": len(multi_bot_manager.active_bots)
        }
