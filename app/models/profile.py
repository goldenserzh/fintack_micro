from decimal import Decimal
from typing import List, Optional
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from ..core.config import Base

class Profile(Base):
    __tablename__ = 'profile'

    profile_id : Mapped[int] = mapped_column(primary_key=True)
    user_id : Mapped[int] = mapped_column(ForeignKey("user.user_id"))
    income : Mapped[Decimal] = mapped_column(Decimal(10,2))
    limit : Mapped[Decimal] = mapped_column(Decimal(10, 2))
    goal : Mapped[str] = mapped_column(String(50))

    user: Mapped["User"] = relationship(back_populates="profile")

    def __repr__(self) -> str:
        return f"Profile(id:{self.profile_id}, income:{self.income}, limit:{self.limit}, goal:{self.goal})"
    

