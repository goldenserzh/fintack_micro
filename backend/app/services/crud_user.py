from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.user import User
from app.models.profile import Profile
from app.schemas.user import UserCreate

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.user_id == user_id).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


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

    # Первый зарегистрированный пользователь становится администратором
    is_first_user = db.query(User).count() == 0

    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        is_admin=is_first_user,
    )
    db.add(db_user)
    db.flush()

    db_profile = Profile(
        user_id=db_user.user_id,
        income=0.0,
        limit=0.0,
        goal='',
        goal_amount=None,
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_user)

    return db_user


def update_user(db: Session, user_id: int, name: Optional[str], email: Optional[str], password: Optional[str]) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    if name is not None:
        user.name = name
    if email is not None:
        user.email = email
    if password is not None:
        _normalize_password_for_bcrypt(password)
        user.hashed_password = pwd_context.hash(password)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> Optional[User]:
    user = db.query(User).filter(User.user_id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return user
    return None
