from pydantic import BaseModel
from typing import List
from datetime import datetime


class ChatMessageSchema(BaseModel):
    message_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionSchema(BaseModel):
    session_id: int
    title: str
    created_at: datetime
    messages: List[ChatMessageSchema] = []

    class Config:
        from_attributes = True


class ChatSessionSummary(BaseModel):
    session_id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    message: str


class SendMessageResponse(BaseModel):
    reply: str
    session_id: int
    title: str | None = None
