from app.models.profile import Profile
from app.schemas.profile import UpdateProfile
from typing import List, Optional
from app.schemas import profile as sc_profile
from sqlalchemy.orm import Session 


def get_profile_by_user_id(db: Session, user_id: int):
    return db.query(Profile).filter(Profile.user_id == user_id)

def change_profile_info(db: Session, db_profile: Profile, update_profile: UpdateProfile):
    update_data = update_profile.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_profile, key, value)
    
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile



