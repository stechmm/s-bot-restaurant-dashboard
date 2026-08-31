from fastapi import APIRouter, HTTPException, Depends
from app.schemas.schemas import LoginRequest, TokenResponse
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    if req.username == settings.ADMIN_USERNAME and req.password == settings.ADMIN_PASSWORD:
        return {
            "access_token": "admin-session-valid-token",
            "token_type": "bearer",
            "username": req.username
        }
    raise HTTPException(status_code=401, detail="အကောင့်အမည် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။ (Invalid credentials)")

@router.get("/me")
async def get_current_user():
    return {"username": settings.ADMIN_USERNAME, "role": "admin"}
