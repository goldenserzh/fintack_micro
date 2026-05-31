from sqlalchemy import Integer, String, Column, Float, DateTime, ForeignKey, Boolean
from datetime import datetime
from .database import Base
from sqlalchemy.orm import Mapped, mapped_column, elationship




class Bank:
    __table_name__ = "T_bank"

    user_id : Mapped[int] = mapped_column(primary_key=True)
    