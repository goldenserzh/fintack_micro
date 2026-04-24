from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.config import get_db
from app.core.security import get_current_user, get_current_admin, check_ownership
from app.schemas.user import UserResponse, UserCreate, UpdateUser
from app.services import crud_user, crud_profile
from app.models.user import User

router = APIRouter(
    tags=['user'],
    responses={404: {"description": "not found"}},
)


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    users = crud_user.get_users(db, skip=skip, limit=limit)
    if not users:
        raise HTTPException(status_code=404, detail="Пользователей не найдено")
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.post("/{user_id}", response_model=UserResponse)
async def create_user_admin(
    user: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if crud_user.get_user_by_email(db, user.email):
        raise HTTPException(status_code=409, detail="Такой пользователь существует")
    return crud_user.create_user(db, user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UpdateUser,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if data.email and data.email != user.email:
        if crud_user.get_user_by_email(db, data.email):
            raise HTTPException(status_code=409, detail="Email уже занят")
    return crud_user.update_user(db, user_id, data.name, data.email, data.password)


@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user_data = UserResponse.model_validate(user)
    crud_profile.delete_profile(db, user_id)
    crud_user.delete_user(db, user_id)
    return user_data
