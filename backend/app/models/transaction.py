from __future__ import annotations
from typing import List, Optional
from sqlalchemy import ForeignKey, DateTime, Numeric
from sqlalchemy import String, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from ..core.config import Base
from datetime import datetime


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id : Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    name: Mapped[str] = mapped_column("title", String(30))
    amount : Mapped[Numeric] = mapped_column("money", Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    category: Mapped[str] = mapped_column(String(20))

    user: Mapped["User"] = relationship("User", back_populates="transactions")

    def __repr__(self):
        return f"Transaction(id:{self.transaction_id}, name:{self.name}, created_at:{self.created_at})"
    