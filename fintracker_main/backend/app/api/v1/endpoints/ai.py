import asyncio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.config import get_db
from app.core.security import get_current_user, check_ownership
from app.models.user import User
from app.services import crud_user, crud_transactions, crud_chat
from app.services.ai_agent import get_ai_reply_async
from app.services.ai_parser import parse_text_to_transactions, parse_image_to_transactions
from app.schemas.chat import (
    ChatSessionSchema, ChatSessionSummary,
    SendMessageRequest, SendMessageResponse,
)
from app.schemas.parse import ParsedTransaction, ParseTransactionsResponse

router = APIRouter(tags=["ai"])


# ─── Sessions ────────────────────────────────────────

@router.get("/sessions/{user_id}", response_model=List[ChatSessionSummary])
async def list_sessions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    return crud_chat.get_sessions(db, user_id)


@router.post("/sessions/{user_id}", response_model=ChatSessionSchema)
async def create_session(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    return crud_chat.create_session(db, user_id)


@router.get("/sessions/{user_id}/{session_id}", response_model=ChatSessionSchema)
async def get_session(
    user_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    session = crud_chat.get_session(db, session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    return session


@router.delete("/sessions/{user_id}/{session_id}")
async def delete_session(
    user_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    if not crud_chat.delete_session(db, session_id, user_id):
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    return {"ok": True}


# ─── Chat ─────────────────────────────────────────────

@router.post("/chat/{user_id}/{session_id}", response_model=SendMessageResponse)
async def chat(
    user_id: int,
    session_id: int,
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)

    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    session = crud_chat.get_session(db, session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")

    # Build context
    transactions = crud_transactions.get_all_transactions(db, user_id, skip=0, limit=100)
    tx_data = [
        {
            "name": tx.name,
            "amount": float(tx.amount),
            "category": tx.category,
            "created_at": tx.created_at.isoformat(),
        }
        for tx in transactions
    ]

    profile_data = {}
    if user.profile:
        p = user.profile
        profile_data = {
            "income": float(p.income),
            "limit": float(p.limit),
            "goal": p.goal,
            "goal_amount": float(p.goal_amount) if p.goal_amount else None,
        }

    history = [{"role": m.role, "content": m.content} for m in session.messages]

    # Save user message
    crud_chat.add_message(db, session_id, "user", request.message)

    # Auto-title: first message becomes the session title
    updated_title = None
    if not session.messages or len(session.messages) == 0:
        updated_title = request.message[:60]
        crud_chat.update_session_title(db, session_id, user_id, updated_title)

    try:
        reply = await get_ai_reply_async(
            user_name=user.name,
            profile=profile_data,
            transactions=tx_data,
            message=request.message,
            history=history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка ИИ-агента: {str(e)}")

    # Save assistant reply
    crud_chat.add_message(db, session_id, "assistant", reply)

    return SendMessageResponse(reply=reply, session_id=session_id, title=updated_title)


# ─── Quick Import ─────────────────────────────────────

@router.post("/parse/{user_id}", response_model=ParseTransactionsResponse)
async def parse_transactions(
    user_id: int,
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)

    if file:
        content = await file.read()
        mime_type = file.content_type or "image/jpeg"
        transactions = await parse_image_to_transactions(content, mime_type)
    elif text:
        transactions = await parse_text_to_transactions(text)
    else:
        raise HTTPException(status_code=400, detail="Передайте text или file")

    return ParseTransactionsResponse(
        transactions=[ParsedTransaction(**t) for t in transactions]
    )
