from fastapi import APIRouter, Depends, HTTPException
from app.core.config import get_db
from app.schemas import profile as sc_profile
from app.services import crud_profile, crud_user
from sqlalchemy.orm import Session


router = APIRouter(
    tags=['profile'],
    responses={404: {"description": "not found"}},
)

@router.get('/{user_id}', response_model=sc_profile.ProfileResponse)
async def get_profile(user_id:int, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    profile = crud_profile.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return profile

@router.patch('/{user_id}', response_model=sc_profile.ProfileResponse)
async def change_profile(user_id: int, update_profile: sc_profile.UpdateProfile, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    profile = crud_profile.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return crud_profile.change_profile_info(db, profile, update_profile)