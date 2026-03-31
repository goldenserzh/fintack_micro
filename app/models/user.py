from __future__ import annotations
from typing import List, Optional
from sqlalchemy import ForeignKey, DateTime
from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from ..core.config import Base
from decimal import Decimal
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    user_id : Mapped[int] = mapped_column(primary_key=True)
    name : Mapped[str] = mapped_column(String(30))
    email: Mapped[str] = mapped_column(String(50), unique=True)
    hashed_password: Mapped[str] = mapped_column(String())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="user")
    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False)

    def __repr__(self) -> str:
        return f"User(id={self.user_id}, name={self.name}, email={self.email})"
    
