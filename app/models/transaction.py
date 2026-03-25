from decimal import Decimal
from typing import List, Optional
from sqlalchemy import ForeignKey, DateTime
from sqlalchemy import String, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from ..core.config import Base
from datetime import datetime


class Transaction(Base):
    __tablename__ = "transaction"

    transaction_id : Mapped[int] = mapped_column(primary_key=True)
    user_id : Mapped[int] = mapped_column(ForeignKey("user.user_id"))
    trans_name: Mapped[str] = mapped_column(String(30))
    amount : Mapped[Decimal] = mapped_column(DECIMAL(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    description: Mapped[str] = mapped_column(String(50))
    category: Mapped[str] = mapped_column(String(20))

    user: Mapped["User"] = relationship(back_populates="transaction")

    def __repr__(self):
        return f"Transaction(id:{self.transaction_id}, trans_name:{self.trans_name}, created_at:{self.created_at})"
    