import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from app.core.database import get_db, AsyncSessionLocal
from app.models.models import BotUser, ChatMessage
from app.schemas.schemas import ChatMessageOut, ChatMessageCreate
from app.routers.deps import get_store_id
from app.bot.multi_bot_manager import multi_bot_manager

router = APIRouter(prefix="/support", tags=["Customer Support Live Chat"])

# Active WebSocket connections for real-time dashboard notifications
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/conversations")
async def get_conversations(
    store_id: Optional[int] = Depends(get_store_id),
    db: AsyncSession = Depends(get_db)
):
    # Get distinct users who have sent messages or have chats
    user_subq = select(distinct(ChatMessage.user_id))
    if store_id is not None:
        user_subq = user_subq.where(ChatMessage.store_id == store_id)

    query = select(BotUser).where(BotUser.id.in_(user_subq))
    if store_id is not None:
        query = query.where(BotUser.store_id == store_id)

    result = await db.execute(query)
    users = result.scalars().all()

    conversations = []
    for user in users:
        # Get latest message
        msg_q = select(ChatMessage).where(ChatMessage.user_id == user.id)
        if store_id is not None:
            msg_q = msg_q.where(ChatMessage.store_id == store_id)
        latest_msg_res = await db.execute(msg_q.order_by(ChatMessage.created_at.desc()).limit(1))
        latest_msg = latest_msg_res.scalar_one_or_none()

        # Unread count
        unread_q = select(func.count(ChatMessage.id)).where(
            ChatMessage.user_id == user.id,
            ChatMessage.sender == "user",
            ChatMessage.is_read == False
        )
        if store_id is not None:
            unread_q = unread_q.where(ChatMessage.store_id == store_id)

        unread = await db.scalar(unread_q) or 0

        conversations.append({
            "user_id": user.id,
            "telegram_id": user.telegram_id,
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or (user.username or "Anonymous User"),
            "username": user.username,
            "unread_count": unread,
            "last_message": latest_msg.message if latest_msg else "",
            "last_message_time": latest_msg.created_at.isoformat() if latest_msg else user.last_active.isoformat()
        })

    conversations.sort(key=lambda x: x["last_message_time"], reverse=True)
    return conversations

@router.get("/messages/{user_id}", response_model=List[ChatMessageOut])
async def get_messages(user_id: int, db: AsyncSession = Depends(get_db)):
    # Mark messages as read
    msgs_res = await db.execute(
        select(ChatMessage).where(ChatMessage.user_id == user_id).order_by(ChatMessage.created_at.asc())
    )
    messages = msgs_res.scalars().all()

    for msg in messages:
        if msg.sender == "user" and not msg.is_read:
            msg.is_read = True
    await db.commit()

    return messages

@router.post("/send", response_model=ChatMessageOut)
async def send_admin_reply(payload: ChatMessageCreate, db: AsyncSession = Depends(get_db)):
    user_res = await db.execute(select(BotUser).where(BotUser.id == payload.user_id))
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    target_store_id = user.store_id or 1

    # Save to database
    chat_msg = ChatMessage(
        store_id=target_store_id,
        user_id=user.id,
        sender="admin",
        message=payload.message,
        is_read=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(chat_msg)
    await db.commit()
    await db.refresh(chat_msg)

    # Deliver via specific store's Telegram Bot to User
    formatted_msg = (
        f"👨‍💼 <b>Support Admin ထံမှ ပြန်ကြားစာ:</b>\n\n"
        f"{payload.message}"
    )
    bot_app = multi_bot_manager.get_bot(target_store_id)
    if bot_app and bot_app.bot:
        try:
            await bot_app.bot.send_message(chat_id=user.telegram_id, text=formatted_msg, parse_mode="HTML")
        except Exception as e:
            pass

    return chat_msg
