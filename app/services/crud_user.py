from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.user import User
from app.models.profile import Profile
from app.schemas.user import UserCreate

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_id(db:Session, user_id: int) -> Optional[User]:
    user = db.query(User).filter(User.user_id == user_id).first()
    return user

def get_users(db: Session, skip: int=0, limit: int = 100) -> List[User]:
    users =  db.query(User).offset(skip).limit(limit).all()
    return users

def get_user_by_email(db:Session, email: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    return user

def _normalize_password_for_bcrypt(password: str) -> str:

    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        raise HTTPException(
            status_code=422,
            detail="Пароль слишком длинный для bcrypt: максимум 72 байта (utf-8).",
        )
    return password

def create_user(db: Session, user: UserCreate) -> User:
    user_password = _normalize_password_for_bcrypt(user.password)
    hashed_password = pwd_context.hash(user_password)
    db_user = User(
        name = user.name,
        email = user.email,
        hashed_password = hashed_password
    )
    db.add(db_user)
    db.flush()

    db_profile = Profile(
        user_id = db_user.user_id,
        income = 0.0,
        limit=0.0,
        goal = '',
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)

    return db_user

def delete_user(db: Session, user_id: int) -> Optional[User]:
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return user
    return None
    
