from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import bearer_scheme, get_current_user
from app.core.exceptions import ResourceNotFoundError
from app.models.training_video import TrainingVideo, TrainingVideoCategory, VideoFavorite
from app.models.user import User
from app.routes import paths
from app.views.training_video import TrainingVideoResponse, VideoFavoriteToggleResponse

router = APIRouter(
    prefix=paths.VIDEOS, tags=["Training Videos"], dependencies=[Depends(bearer_scheme)]
)


@router.get("", response_model=list[TrainingVideoResponse])
def list_videos(
    category: TrainingVideoCategory | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[TrainingVideo]:
    stmt = select(TrainingVideo)
    if category is not None:
        stmt = stmt.where(TrainingVideo.category == category)
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            TrainingVideo.title.ilike(term) | TrainingVideo.description.ilike(term)
        )
    stmt = stmt.order_by(TrainingVideo.created_at.desc(), TrainingVideo.id.desc())
    return list(db.scalars(stmt))


@router.post("/{video_id}/favorite", response_model=VideoFavoriteToggleResponse)
def toggle_favorite(
    video_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> VideoFavoriteToggleResponse:
    video = db.get(TrainingVideo, video_id)
    if video is None:
        raise ResourceNotFoundError("Training video", video_id)

    favorite = db.scalar(
        select(VideoFavorite).where(
            VideoFavorite.video_id == video_id, VideoFavorite.user_id == user.id
        )
    )
    if favorite is not None:
        db.delete(favorite)
        db.commit()
        return VideoFavoriteToggleResponse(video_id=video_id, favorited=False)

    db.add(VideoFavorite(video_id=video_id, user_id=user.id))
    db.commit()
    return VideoFavoriteToggleResponse(video_id=video_id, favorited=True)


@router.get("/favorites", response_model=list[TrainingVideoResponse])
def list_favorites(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TrainingVideo]:
    stmt = (
        select(TrainingVideo)
        .join(VideoFavorite, VideoFavorite.video_id == TrainingVideo.id)
        .where(VideoFavorite.user_id == user.id)
        .order_by(VideoFavorite.created_at.desc(), VideoFavorite.id.desc())
    )
    return list(db.scalars(stmt))
