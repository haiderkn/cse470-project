import enum
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TrainingVideoCategory(str, enum.Enum):
    OBEDIENCE = "Obedience"
    TOILET_TRAINING = "Toilet Training"
    FEEDING = "Feeding"
    BEHAVIORAL_CARE = "Behavioral Care"


class TrainingVideo(Base):
    __tablename__ = "training_videos"
    __table_args__ = (
        CheckConstraint("duration_minutes > 0", name="ck_training_videos_duration_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[TrainingVideoCategory] = mapped_column(
        Enum(
            TrainingVideoCategory,
            values_callable=lambda categories: [category.value for category in categories],
        )
    )
    youtube_video_id: Mapped[str] = mapped_column(String(20))
    duration_minutes: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class VideoFavorite(Base):
    __tablename__ = "video_favorites"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    video_id: Mapped[int] = mapped_column(
        ForeignKey("training_videos.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
