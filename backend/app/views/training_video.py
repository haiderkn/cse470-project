from datetime import datetime

from pydantic import Field

from app.models.training_video import TrainingVideoCategory
from app.views.auth import CamelModel


class TrainingVideoRequest(CamelModel):
    title: str = Field(min_length=1, max_length=255)
    description: str
    category: TrainingVideoCategory
    youtube_video_id: str = Field(min_length=1, max_length=20)
    duration_minutes: int = Field(gt=0)


class TrainingVideoResponse(CamelModel):
    id: int
    title: str
    description: str
    category: TrainingVideoCategory
    youtube_video_id: str
    duration_minutes: int
    created_at: datetime


class VideoFavoriteToggleResponse(CamelModel):
    video_id: int
    favorited: bool
