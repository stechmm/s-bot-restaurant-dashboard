import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from app.core.database import get_db
from app.models.review import Review
from app.models.models import BotUser, Order

router = APIRouter(prefix="/reviews", tags=["Reviews"])

class ReviewCreate(BaseModel):
    order_id: Optional[int] = None
    user_id: Optional[int] = None
    rating: int  # 1-5
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    order_id: Optional[int]
    user_id: Optional[int]
    rating: int
    comment: Optional[str]
    created_at: datetime.datetime
    user: Optional[dict] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[dict])
async def list_reviews(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).options(
            selectinload(Review.user),
            selectinload(Review.order)
        ).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    out = []
    for r in reviews:
        out.append({
            "id": r.id,
            "order_id": r.order_id,
            "order_code": r.order.order_code if r.order else None,
            "user_id": r.user_id,
            "user_name": (r.user.first_name or "") + " " + (r.user.last_name or "") if r.user else "Unknown",
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat()
        })
    return out

@router.post("/", response_model=dict)
async def create_review(payload: ReviewCreate, db: AsyncSession = Depends(get_db)):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    review = Review(**payload.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return {"id": review.id, "rating": review.rating, "message": "Review saved"}

@router.delete("/{review_id}")
async def delete_review(review_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    await db.delete(review)
    await db.commit()
    return {"message": "Review deleted"}
