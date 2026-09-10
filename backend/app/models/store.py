import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False) # e.g. "Pandora Food House", "Yangon Style Boutique"
    business_type = Column(String(50), default="restaurant") # "restaurant", "retail", "service", "general"
    bot_token = Column(String(200), nullable=True)
    bot_username = Column(String(100), nullable=True) # e.g. "@pandorafoodbot"
    currency = Column(String(20), default="MMK")
    description = Column(Text, nullable=True)
    admin_telegram_id = Column(String(100), nullable=True) # Instant order alerts
    support_chat_id = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    categories = relationship("Category", back_populates="store", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store", cascade="all, delete-orphan")
    coupons = relationship("Coupon", back_populates="store", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="store", cascade="all, delete-orphan")
