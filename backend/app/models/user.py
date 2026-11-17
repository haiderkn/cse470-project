from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.role import Role

if TYPE_CHECKING:
    from app.models.pet import Pet
    from app.models.task import Task


class User(Base):
    """Application user / pet owner (the `users` table)."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    # BCrypt hash. Never store raw passwords.
    password: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.USER)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True, default=None)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True, default=None)
    emergency_contact: Mapped[str | None] = mapped_column(String(100), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    pets: Mapped[list["Pet"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
