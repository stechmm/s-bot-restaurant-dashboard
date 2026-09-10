import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=True, default=1)
    code = Column(String(50), index=True, nullable=False)
    description = Column(String(200), nullable=True)
    discount_type = Column(String(20), default="percent")  # 'percent' or 'flat'
    discount_value = Column(Float, nullable=False)          # % or flat MMK amount
    min_order_amount = Column(Float, default=0)
    max_uses = Column(Integer, default=0)                   # 0 = unlimited
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    store = relationship("Store", back_populates="coupons")
