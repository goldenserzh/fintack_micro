from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal

class TransactionBase(BaseModel):
    name: str
    amount: Decimal
    category: str

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    transaction_id: int
    user_id: int
    created_at: datetime   

    class Config:
        from_attributes = True

class TransactionUpdate(TransactionBase):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    category: Optional[str] = None