import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.coupon import Coupon

router = APIRouter(prefix="/coupons", tags=["Coupons"])

class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str = "percent"   # 'percent' or 'flat'
    discount_value: float
    min_order_amount: float = 0
    max_uses: int = 0
    is_active: bool = True
    expires_at: Optional[datetime.datetime] = None

class CouponOut(BaseModel):
    id: int
    code: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    min_order_amount: float
    max_uses: int
    used_count: int
    is_active: bool
    expires_at: Optional[datetime.datetime]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[CouponOut])
async def list_coupons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Coupon).order_by(Coupon.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=CouponOut)
async def create_coupon(payload: CouponCreate, db: AsyncSession = Depends(get_db)):
    # Check duplicate code
    existing = await db.execute(select(Coupon).where(Coupon.code == payload.code.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    coupon = Coupon(**payload.model_dump(), code=payload.code.upper())
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon

@router.put("/{coupon_id}", response_model=CouponOut)
async def update_coupon(coupon_id: int, payload: CouponCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    for k, v in payload.model_dump().items():
        if k == "code":
            setattr(coupon, k, v.upper())
        else:
            setattr(coupon, k, v)
    await db.commit()
    await db.refresh(coupon)
    return coupon

@router.delete("/{coupon_id}")
async def delete_coupon(coupon_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    await db.delete(coupon)
    await db.commit()
    return {"message": "Coupon deleted"}

@router.post("/validate")
async def validate_coupon(code: str, order_amount: float, db: AsyncSession = Depends(get_db)):
    """Validate a coupon and return discount amount."""
    result = await db.execute(select(Coupon).where(Coupon.code == code.upper(), Coupon.is_active == True))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon မမှန်ကန်ပါ သို့မဟုတ် မရှိပါ")

    now = datetime.datetime.utcnow()
    if coupon.expires_at and coupon.expires_at < now:
        raise HTTPException(status_code=400, detail="Coupon သက်တမ်းကုန်သွားပြီ")
    if coupon.max_uses > 0 and coupon.used_count >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="Coupon အသုံးပြုနိုင်သည့် အကြိမ်ရောက်နေပြီ")
    if order_amount < coupon.min_order_amount:
        raise HTTPException(status_code=400, detail=f"အနည်းဆုံး {coupon.min_order_amount:,.0f} MMK မှသာ သုံးနိုင်သည်")

    if coupon.discount_type == "percent":
        discount = round(order_amount * coupon.discount_value / 100, 0)
    else:
        discount = min(coupon.discount_value, order_amount)

    return {
        "valid": True,
        "coupon_id": coupon.id,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "discount_amount": discount,
        "final_amount": order_amount - discount
    }
