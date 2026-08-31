import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import Category, Product
from app.schemas.schemas import CategoryCreate, CategoryOut, ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["Products & Categories"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Category Endpoints ---
@router.get("/categories", response_model=List[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.id.desc()))
    return result.scalars().all()

@router.post("/categories", response_model=CategoryOut)
async def create_category(payload: CategoryCreate, db: AsyncSession = Depends(get_db)):
    category = Category(**payload.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.put("/categories/{cat_id}", response_model=CategoryOut)
async def update_category(cat_id: int, payload: CategoryCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).where(Category.id == cat_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for k, v in payload.model_dump().items():
        setattr(category, k, v)
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/categories/{cat_id}")
async def delete_category(cat_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).where(Category.id == cat_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted successfully"}

# --- Product Endpoints ---
@router.get("/", response_model=List[ProductOut])
async def list_products(category_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Product).options(selectinload(Product.category)).order_by(Product.id.desc())
    if category_id:
        query = query.where(Product.category_id == category_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductOut)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    result = await db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == product.id))
    return result.scalar_one()

@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: int, payload: ProductCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for k, v in payload.model_dump().items():
        setattr(product, k, v)
    await db.commit()
    res = await db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == product.id))
    return res.scalar_one()

@router.delete("/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()
    return {"message": "Product deleted successfully"}

@router.post("/upload-image")
async def upload_product_image(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"image_url": f"/uploads/{filename}"}
