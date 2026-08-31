from pydantic import BaseModel, ConfigDict
from typing import Optional, List
import datetime

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "📦"
    is_active: Optional[bool] = True

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: float
    stock: int = 0
    image_url: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    created_at: datetime.datetime
    category: Optional[CategoryOut] = None
    model_config = ConfigDict(from_attributes=True)

class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    price: float
    quantity: int
    subtotal: float
    model_config = ConfigDict(from_attributes=True)

class OrderOut(BaseModel):
    id: int
    order_code: Optional[str]
    user_id: Optional[int]
    customer_name: str
    customer_phone: str
    delivery_address: str
    total_amount: float
    payment_method: str
    payment_slip_url: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    items: List[OrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class BotUserOut(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_blocked: bool
    created_at: datetime.datetime
    last_active: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class ChatMessageCreate(BaseModel):
    user_id: int
    message: str

class ChatMessageOut(BaseModel):
    id: int
    user_id: int
    sender: str
    message: str
    media_url: Optional[str] = None
    is_read: bool
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class NewsPostBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    button_text: Optional[str] = None
    button_url: Optional[str] = None
    is_published: bool = True

class NewsPostCreate(NewsPostBase):
    pass

class NewsPostOut(NewsPostBase):
    id: int
    views_count: int
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class BroadcastRequest(BaseModel):
    message_text: str
    image_url: Optional[str] = None
    button_text: Optional[str] = None
    button_url: Optional[str] = None

class FAQBase(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "General"
    order_index: Optional[int] = 0
    is_active: Optional[bool] = True

class FAQCreate(FAQBase):
    pass

class FAQOut(FAQBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
