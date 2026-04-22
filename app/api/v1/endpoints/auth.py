from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.config import get_db
from app.schemas.user import UserLogin, UserCreate, UserResponse
from app.services.crud_user import authenticate_user, create_user, get_users
from app.models.user import User

router = APIRouter(tags=["auth"])


@router.get("/has_users")
async def has_users(db: Session = Depends(get_db)):
    return {"has_users": db.query(User).count() > 0}


@router.post("/login", response_model=UserResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    return user


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    from app.services.crud_user import get_user_by_email
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует")
    return create_user(db, user_data)
