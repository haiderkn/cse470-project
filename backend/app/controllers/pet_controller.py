from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.pet import Pet
from app.models.user import User
from app.services import pet_service
from app.views.pet import PetRequest


def list_pets(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Pet]:
    """List all pets belonging to the logged-in owner."""
    return pet_service.find_all_for_owner(db, user)


def get_pet(
    pet_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> Pet:
    """Retrieve details for a single pet."""
    return pet_service.find_one(db, pet_id, user)


def create_pet(
    data: PetRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> Pet:
    """Add a new pet profile."""
    return pet_service.create(db, data, user)


def update_pet(
    pet_id: int,
    data: PetRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Pet:
    """Update an existing pet profile."""
    return pet_service.update(db, pet_id, data, user)


def delete_pet(
    pet_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> None:
    """Delete a pet profile."""
    pet_service.delete(db, pet_id, user)
