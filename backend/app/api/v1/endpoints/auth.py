from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import get_db
from app.core.security import create_access_token
from app.schemas.user import UserLogin, UserCreate, UserResponse, AuthResponse
from app.services.crud_user import authenticate_user, create_user, get_user_by_email
from app.models.user import User

router = APIRouter(tags=["auth"])


@router.get("/has_users")
async def has_users(db: Session = Depends(get_db)):
    return {"has_users": db.query(User).count() > 0}


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    token = create_access_token(user.user_id)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует")
    user = create_user(db, user_data)
    token = create_access_token(user.user_id)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))
