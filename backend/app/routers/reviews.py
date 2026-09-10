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
from app.routers.deps import get_store_id

router = APIRouter(prefix="/reviews", tags=["Reviews"])

class ReviewCreate(BaseModel):
    order_id: Optional[int] = None
    user_id: Optional[int] = None
    rating: int  # 1-5
    comment: Optional[str] = None

@router.get("/", response_model=List[dict])
async def list_reviews(
    store_id: Optional[int] = Depends(get_store_id),
    db: AsyncSession = Depends(get_db)
):
    query = select(Review).options(
        selectinload(Review.user),
        selectinload(Review.order)
    ).order_by(Review.created_at.desc())
    if store_id is not None:
        query = query.where(Review.store_id == store_id)

    result = await db.execute(query)
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
async def create_review(
    payload: ReviewCreate,
    store_id: Optional[int] = Depends(get_store_id),
    db: AsyncSession = Depends(get_db)
):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    review = Review(**payload.model_dump(), store_id=store_id or 1)
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
