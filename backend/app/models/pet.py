from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Pet(Base):
    """Pet entity belonging to an owner."""

    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    species: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., Dog, Cat, Bird, Rabbit
    breed: Mapped[str | None] = mapped_column(String(100), nullable=True, default=None)
    age: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)  # e.g., "2 years", "6 months"
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True, default=None)  # Male, Female, Other
    weight: Mapped[str | None] = mapped_column(String(30), nullable=True, default=None)  # e.g., "4.5 kg"
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True, default=None)
    care_notes: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)  # Dietary, medication, habits

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    owner: Mapped["User"] = relationship(back_populates="pets")
