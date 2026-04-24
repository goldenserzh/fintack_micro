from . import schemas, models
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from sqlalchemy import func

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_user(db: Session, user: schemas.UserCreate):
    
    hashed_password = pwd_context.hash(user.password)

    db_user = models.User(
        name=user.name,
        email=user.email,
        login =user.login,
        age = user.age,
        gender = user.gender,
        hashedpassword = hashed_password
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email:str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_transaction = models.Transaction(
        title = transaction.title,
        amount = transaction.amount,
        category = transaction.category,
        user_id = transaction.user_id
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_transactions(db: Session, user_id: int,limit: int = 10, category: str = None):
    querty =  db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()
    if category:
        querty = querty.filter(models.Transaction.category == category)
    return querty.limit(limit).all()

def transaction_by_id(db: Session, user_id: int, transaction_id):
    return db.query(models.Transaction).filter(models.Transaction.user_id == user_id,
                                                models.Transaction.transaction_id == transaction_id).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_summ_spent(db: Session, user_id:int):
    return db.query(func.sum(models.Transaction.money)).filter(models.User.user_id == user_id)

def get_amount_transactions(db: Session, user_id:int):
    return db.query(func.count(models.Transaction)).filter(models.User.user_id == user_id)

def get_average_check(db:Session, user_id:int):
    total_summ = get_summ_spent(db, user_id)
    amount_transactions = get_amount_transactions(db, user_id)
    return total_summ/amount_transactions
    



