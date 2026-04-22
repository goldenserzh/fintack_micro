from typing import Optional
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.config import Base


class Profile(Base):
    __tablename__ = 'profile'

    profile_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    income: Mapped[Numeric] = mapped_column(Numeric(10, 2))
    limit: Mapped[Numeric] = mapped_column(Numeric(10, 2))
    goal: Mapped[str] = mapped_column(String(50))
    goal_amount: Mapped[Optional[Numeric]] = mapped_column(Numeric(10, 2), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"Profile(id:{self.profile_id}, income:{self.income}, limit:{self.limit}, goal:{self.goal})"
