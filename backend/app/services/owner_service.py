from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories import pet_repository, user_repository
from app.views.owner import OwnerProfileResponse, OwnerProfileUpdate


def get_profile(db: Session, user: User) -> OwnerProfileResponse:
    pet_count = pet_repository.count_by_owner(db, user.id)
    return OwnerProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        phone=user.phone,
        address=user.address,
        bio=user.bio,
        avatar_url=user.avatar_url,
        emergency_contact=user.emergency_contact,
        total_pets=pet_count,
        created_at=user.created_at,
    )


def update_profile(
    db: Session, data: OwnerProfileUpdate, user: User
) -> OwnerProfileResponse:
    user.name = data.name
    user.phone = data.phone
    user.address = data.address
    user.bio = data.bio
    user.avatar_url = data.avatar_url
    user.emergency_contact = data.emergency_contact
    saved_user = user_repository.save(db, user)
    return get_profile(db, saved_user)
