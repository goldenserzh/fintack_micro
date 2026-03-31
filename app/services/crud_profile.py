from app.models.profile import Profile
from app.schemas.profile import UpdateProfile
from typing import Optional
from sqlalchemy.orm import Session 


def get_profile_by_user_id(db: Session, user_id: int) -> Optional[Profile]:
    return db.query(Profile).filter(Profile.user_id == user_id).first()

def change_profile_info(db: Session, db_profile: Profile, update_profile: UpdateProfile) -> Profile:
    update_data = update_profile.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_profile, key, value)
    
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def delete_profile(db: Session, user_id):
    profile = get_profile_by_user_id(db, user_id)
    if profile:
        db.delete(profile)
        db.commit()
        return profile
    return None

