"""Трекер личный финансов"""
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import crud, models, schemas, database, auth
from typing import List
from passlib.context import CryptContext
from exceptions import raise_exceptions

app = FastAPI()

models.Base.metadata.create_all(bind=database.engine)

def get_db():
    db = database.Sessionlocal()
    try:
        yield db
    finally:
        db.close()

#--------Пользовательские функции-----------------------
@app.post("/login", response_model=schemas.UserLogin)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, user_data.email)
    if not user:
        raise HTTPException(status_code=404, detail='Пользователь не найден')
    
    if not crud.verify_password(user_data.password, user.hashedpassword):
        raise HTTPException(status_code=401, detail='Пароль неверный')
    
    token = auth.create_access_token(data={'sub': str(user.user_id)}) 
    return {'access_token': token, 'token_type': 'bearer'}


@app.get('/me', response_model=schemas.UserResponse)
def get_info(db: Session = Depends(get_db),
             current_user: models.User = Depends(auth.get_current_user)):
    user = crud.get_user_by_id(db, current_user.user_id)
    if not user:
        raise HTTPException(status_code=404, detail='Пользователь не найден!')
    else:
        return user
    

@app.get('/my_transactions', response_model=List[schemas.TransactionResponse])
def get_all_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    limit: int = 10, 
    category: str | None = None 
):
    return crud.get_transactions(
        db, 
        user_id=current_user.user_id, 
        limit=limit, 
        category=category
    )

@app.get('/my_transactions/{transaction_id}', response_model=schemas.TransactionResponse)
def get_current_transactions(transaction_id: int, 
                             db: Session = Depends(get_db),
                             current_user: models.User = Depends(auth.get_current_user)):
    
    transaction = crud.transaction_by_id(db, current_user.user_id, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail='Транзакции такой нету')
    else:
        return transaction
    
@app.get('/my_transactions/stats', response_model=schemas.UserStat)
def get_transactions(db: Session = Depends(get_db),
                     current_user: models.User = Depends(auth.get_current_user)):
    total_summ = crud.get_summ_spent(db, current_user.user_id)
    return 