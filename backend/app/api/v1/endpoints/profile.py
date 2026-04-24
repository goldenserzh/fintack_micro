from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import get_db
from app.core.security import get_current_user, check_ownership
from app.schemas.profile import ProfileResponse, UpdateProfile
from app.services import crud_profile, crud_user
from app.models.user import User

router = APIRouter(
    tags=['profile'],
    responses={404: {"description": "not found"}},
)


@router.get('/{user_id}', response_model=ProfileResponse)
async def get_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    profile = crud_profile.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return profile


@router.patch('/{user_id}', response_model=ProfileResponse)
async def change_profile(
    user_id: int,
    update_profile: UpdateProfile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    profile = crud_profile.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return crud_profile.change_profile_info(db, profile, update_profile)
