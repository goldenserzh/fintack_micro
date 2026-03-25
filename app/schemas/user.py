from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    pass

class UpdateUser(UserBase):
    name: Optional[str] = None
    password: Optional[str] = None
    

#------------ТРАНЗАКЦИИ----------

class BaseTransaction(BaseModel):
    title: str
    money: float
    description: str
    category: str

class TransactionCreate(BaseTransaction):
    pass

class UpdateTransactions(BaseTransaction):
    title: Optional[str] = None
    money: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None

class Transactions(BaseTransaction):
    transaction_id: int
    created_at: datetime.now

