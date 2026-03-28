from app.models import transaction
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.config import get_db  
from app.schemas import transaction as sc_transactions
from app.services import crud_transactions, crud_user

router = APIRouter()

@router.get("/{user_id}", response_model=List[sc_transactions.TransactionResponse])
def get_transactions(user_id: int, skip:int =0, limit:int =100, db:Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="пользователь не найден")
    return crud_transactions.get_all_transactions(db, user_id, skip, limit)

@router.get("/{user_id}/{transaction_id}", response_model=sc_transactions.TransactionResponse)
def get_transaction_by_id(user_id:int, transaction_id:int, db :Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    transaction = crud_transactions.get_transaction_by_id(db,user_id, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Транзакции не существует")
    return transaction

@router.post("/{user_id}", response_model=sc_transactions.TransactionResponse, status_code=201)
def create_transaction(transaction:sc_transactions.TransactionCreate,user_id: int, db: Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return crud_transactions.create_transaction(db, transaction, user_id)

@router.delete("/{transaction_id}", response_model=sc_transactions.TransactionResponse)
def delete_transaction(transaction_id: int, user_id:int, db:Session = Depends(get_db)):
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    transaction = crud_transactions.get_transaction_by_id(db, user_id, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
    return crud_transactions.delete_transaction(db, transaction_id, user_id)
    
