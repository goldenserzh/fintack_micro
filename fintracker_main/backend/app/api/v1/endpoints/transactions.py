from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.config import get_db
from app.core.security import get_current_user, check_ownership
from app.schemas.transaction import TransactionResponse, TransactionCreate
from app.services import crud_transactions, crud_user
from app.models.user import User

router = APIRouter(
    tags=['transactions'],
    responses={404: {"description": "not found"}},
)


@router.get("/{user_id}", response_model=List[TransactionResponse])
async def get_transactions(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return crud_transactions.get_all_transactions(db, user_id, skip, limit)


@router.get("/{user_id}/{transaction_id}", response_model=TransactionResponse)
async def get_transaction_by_id(
    user_id: int,
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    transaction = crud_transactions.get_transaction_by_id(db, user_id, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
    return transaction


@router.post("/{user_id}", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    user_id: int,
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    user = crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return crud_transactions.create_transaction(db, transaction, user_id)


@router.delete("/{user_id}/{transaction_id}", response_model=TransactionResponse)
async def delete_transaction(
    user_id: int,
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_ownership(current_user, user_id)
    transaction = crud_transactions.get_transaction_by_id(db, user_id, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
    return crud_transactions.delete_transaction(db, transaction_id, user_id)
