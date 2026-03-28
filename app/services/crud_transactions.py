from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate



def get_all_transactions(db: Session, user_id: int, skip:int = 0, limit:int = 100) -> List[Transaction]:
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).offset(skip).limit(limit).all()
    return transactions

def get_transaction_by_id(db: Session, user_id:int, transaction_id: int) -> Optional[Transaction]:
    transaction = db.query(Transaction).filter(Transaction.user_id == user_id, 
                                               Transaction.transaction_id == transaction_id
                                               ).first()
    return transaction

def create_transaction(db: Session, transaction: TransactionCreate, user_id: int) -> Transaction:
    db_transaction = Transaction(**transaction.model_dump(),
                                 user_id = user_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def delete_transaction(db: Session, transaction_id: int, user_id: int) -> Optional[Transaction]:
    transaction_db = db.query(Transaction).filter(Transaction.user_id == user_id,
                                               Transaction.transaction_id == transaction_id).first()
    if transaction_db:
        db.delete(transaction_db)
        db.commit()
        return transaction_db
    return None




