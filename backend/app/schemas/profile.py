from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class ProfileBase(BaseModel):
    income: Decimal
    limit: Decimal
    goal: str


class ProfileCreate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    profile_id: int
    user_id: int
    goal_amount: Optional[Decimal] = None

    class Config:
        from_attributes = True


class UpdateProfile(BaseModel):
    income: Optional[Decimal] = None
    limit: Optional[Decimal] = None
    goal: Optional[str] = None
    goal_amount: Optional[Decimal] = None
