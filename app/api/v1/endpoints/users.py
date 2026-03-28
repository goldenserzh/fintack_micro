from app.models import user
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.config import  get_db  
from app.schemas import user as sc_user
from app.services import crud_user


router = APIRouter()

@router.get("/", response_model=List[sc_user.UserResponse])
def get_users(skip:int= 0, limit: int = 100, db: Session = Depends(get_db)):
    users =  crud_user.get_users(db, skip=skip, limit=limit)
    if not users:
        raise HTTPException(status_code=404, detail="Пользователей не найдено")
    return users

@router.get("/{user_id}", response_model=sc_user.UserResponse)
def read_user(user_id: int, db:Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.post("/", response_model=sc_user.UserResponse)
def create_user(user:sc_user.UserCreate, db: Session = Depends(get_db)):
    if crud_user.get_user_by_email(db, user.email):
        raise HTTPException(status_code=409, detail="Такой пользователь существует")
    return crud_user.create_user(db, user)

@router.delete("/{user_id}", response_model=sc_user.UserResponse)
def delete_user(user_id: int , db: Session = Depends(get_db)):
    if not crud_user.get_user_by_id(db, user_id):
        raise HTTPException(status_code=404, detail="Пользователь не существует")
    return crud_user.delete_user(db, user_id)


