import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class BotUser(Base):
    __tablename__ = "bot_users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    is_blocked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)

    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(20), default="📦")
    is_active = Column(Boolean, default=True)
    
    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    category = relationship("Category", back_populates="products")

class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("bot_users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("BotUser", back_populates="cart_items")
    product = relationship("Product")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("bot_users.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    delivery_address = Column(Text, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="COD") # COD, KPay, WavePay, Banking
    payment_slip_url = Column(String(500), nullable=True)
    status = Column(String(50), default="Pending") # Pending, Confirmed, Shipped, Delivered, Cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("BotUser", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, nullable=True)
    product_name = Column(String(200), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    subtotal = Column(Float, nullable=False)
    
    order = relationship("Order", back_populates="items")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("bot_users.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(20), default="user") # 'user', 'admin', 'bot'
    message = Column(Text, nullable=False)
    media_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("BotUser", back_populates="messages")

class NewsPost(Base):
    __tablename__ = "news_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    button_text = Column(String(100), nullable=True)
    button_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=True)
    views_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BroadcastLog(Base):
    __tablename__ = "broadcast_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    message_text = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    total_sent = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FAQ(Base):
    __tablename__ = "faqs"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(300), nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(100), default="General")
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class AppSetting(Base):
    __tablename__ = "app_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
    description = Column(String(250), nullable=True)
