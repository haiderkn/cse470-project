from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import owner_service
from app.views.owner import OwnerProfileResponse, OwnerProfileUpdate


def get_profile(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> OwnerProfileResponse:
    """Retrieve the current owner's profile and pet count."""
    return owner_service.get_profile(db, user)


def update_profile(
    data: OwnerProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OwnerProfileResponse:
    """Update profile details (name, phone, address, bio, avatar, emergency contact)."""
    return owner_service.update_profile(db, data, user)
