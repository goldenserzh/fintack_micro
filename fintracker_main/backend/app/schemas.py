from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime

class TransactionBase(BaseModel):
    title:str
    @field_validator('title')
    def check_len(cls, value):
        if len(value) == 0:
            raise ValueError('Строка не должны быть пустой!')
        if len(value) >= 50:
            raise ValueError('Строка не должны быть больше 50 символов!')
        return value

    money:float = Field(...,  gt=0)
    category:str = 'Другое' 
    @field_validator('category')
    def check_category(ctl, value):
        if value not in ['Еда', 'Транспорт', 'Жилье', "Развлечения", 'Здоровье', 'Связь','Другое']:
            raise ValueError('Выберите из предоставленных категорию трат')
        return value
    

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    transaction_id:int
    created_at:datetime

    class Config:
        from_attributes = True

#---------Users------------
class UserBase(BaseModel):
    name: str
    login: str
    email: EmailStr
    age: int = Field(..., gt = 0)
    gender: str

class UserCreate(UserBase):
    password:str


class UserResponse(UserBase):
    user_id:int
    transactions: List[TransactionResponse] = []

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password : str

class UserStat(BaseModel):
    total_spent : float
    transaction_count : int
    average_spent : float


