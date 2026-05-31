from __future__ import annotations
from typing import List, Optional
from sqlalchemy import ForeignKey, DateTime, Boolean
from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from .db_connection import Base
from decimal import Decimal
from datetime import datetime

class Tbank(Base):
    __table_name__ = 'tbank_general'

    client_id : Mapped[int] = mapped_column(primary_key=True)
    fio = Mapped[str] = mapped_column(String(50), unique=True)
    passport_identificator = Mapped[int] = mapped_column(Decimal())


    


