import datetime
from sqlalchemy import Column, Integer, BigInteger, Float, Boolean, DateTime, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("bot_users.id", ondelete="CASCADE"), nullable=True)
    rating = Column(Integer, nullable=False)          # 1-5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", foreign_keys=[order_id])
    user = relationship("BotUser", foreign_keys=[user_id])
