from sqlalchemy import Integer, String, Column, Float, DateTime, ForeignKey, Boolean
from datetime import datetime
from .database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    age = Column(Integer, index=True, nullable=False)
    login = Column(String,unique=True, index=True, nullable=False)
    hashedpassword = Column(String, nullable=False)
    gender = Column(String, nullable=False, index=True)

    transactions = relationship('Transaction', back_populates='owner')

class Transaction(Base):
    __tablename__ = 'transactions'

    transaction_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    money = Column(Float, nullable=False)
    category = Column(String, nullable=False, default='Другое')
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    owner = relationship('User', back_populates='transactions')




    



    


