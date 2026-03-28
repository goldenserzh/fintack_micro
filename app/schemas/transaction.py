from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal

class TransactionBase(BaseModel):
    trans_name: str
    amount: Decimal
    description: Optional[str] = None
    category: str
    


class TransactionResponse(TransactionBase):
    transaction_id: int
    user_id: int
    created_at: datetime   


    class Config:
        from_attributes = True

class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    trans_name: Optional[str] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    category: Optional[str] = None