from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.chat import ChatSession, ChatMessage


def get_sessions(db: Session, user_id: int) -> List[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )


def get_session(db: Session, session_id: int, user_id: int) -> Optional[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(ChatSession.session_id == session_id, ChatSession.user_id == user_id)
        .first()
    )


def create_session(db: Session, user_id: int, title: str = "Новый чат") -> ChatSession:
    session = ChatSession(user_id=user_id, title=title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def delete_session(db: Session, session_id: int, user_id: int) -> bool:
    session = get_session(db, session_id, user_id)
    if not session:
        return False
    db.delete(session)
    db.commit()
    return True


def add_message(db: Session, session_id: int, role: str, content: str) -> ChatMessage:
    msg = ChatMessage(session_id=session_id, role=role, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def update_session_title(db: Session, session_id: int, user_id: int, title: str) -> Optional[ChatSession]:
    session = get_session(db, session_id, user_id)
    if not session:
        return None
    session.title = title[:100]
    db.commit()
    db.refresh(session)
    return session
