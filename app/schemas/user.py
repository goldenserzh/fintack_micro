from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.schemas import profile, transaction



class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Пароль должен быть минимум 8 символов")
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    user_id: int
    created_at : datetime
    profile: Optional[profile.ProfileResponse]
    transactions: List[transaction.TransactionResponse] = []

    class Config:
        from_attributes = True

class UpdateUser(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None


