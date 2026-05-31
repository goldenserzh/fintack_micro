from pydantic import BaseModel
from typing import List


class ParsedTransaction(BaseModel):
    name: str
    amount: float
    category: str


class ParseTransactionsResponse(BaseModel):
    transactions: List[ParsedTransaction]
