import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.coupon import Coupon
from app.routers.deps import get_store_id

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
    store_id: Optional[int] = 1
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
async def list_coupons(
    store_id: Optional[int] = Depends(get_store_id),
    db: AsyncSession = Depends(get_db)
):
    query = select(Coupon).order_by(Coupon.created_at.desc())
    if store_id is not None:
        query = query.where(Coupon.store_id == store_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=CouponOut)
async def create_coupon(
    payload: CouponCreate,
    store_id: Optional[int] = Depends(get_store_id),
    db: AsyncSession = Depends(get_db)
):
    actual_store_id = store_id or 1
    # Check duplicate code within same store
    existing = await db.execute(
        select(Coupon).where(Coupon.code == payload.code.upper(), Coupon.store_id == actual_store_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Coupon code already exists for this store")
    coupon = Coupon(**payload.model_dump(), code=payload.code.upper(), store_id=actual_store_id)
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
async def validate_coupon(
    code: str,
    order_amount: float,
    store_id: Optional[int] = Depends(get_store_id),
    db: AsyncSession = Depends(get_db)
):
    """Validate a coupon and return discount amount."""
    query = select(Coupon).where(Coupon.code == code.upper(), Coupon.is_active == True)
    if store_id is not None:
        query = query.where(Coupon.store_id == store_id)
    result = await db.execute(query)
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
