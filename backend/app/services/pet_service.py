"""Business logic for pets, always scoped to the logged-in owner."""
from sqlalchemy.orm import Session

from app.core.exceptions import ResourceNotFoundError
from app.models.pet import Pet
from app.models.user import User
from app.repositories import pet_repository
from app.views.pet import PetRequest


def find_all_for_owner(db: Session, user: User) -> list[Pet]:
    return pet_repository.find_by_owner(db, user.id)


def find_one(db: Session, pet_id: int, user: User) -> Pet:
    return _require_owned_pet(db, pet_id, user)


def create(db: Session, data: PetRequest, user: User) -> Pet:
    pet = Pet(
        name=data.name,
        species=data.species,
        breed=data.breed,
        age=data.age,
        gender=data.gender,
        weight=data.weight,
        photo_url=data.photo_url,
        care_notes=data.care_notes,
        owner_id=user.id,
    )
    return pet_repository.save(db, pet)


def update(db: Session, pet_id: int, data: PetRequest, user: User) -> Pet:
    pet = _require_owned_pet(db, pet_id, user)
    pet.name = data.name
    pet.species = data.species
    pet.breed = data.breed
    pet.age = data.age
    pet.gender = data.gender
    pet.weight = data.weight
    pet.photo_url = data.photo_url
    pet.care_notes = data.care_notes
    return pet_repository.save(db, pet)


def delete(db: Session, pet_id: int, user: User) -> None:
    pet = _require_owned_pet(db, pet_id, user)
    pet_repository.delete(db, pet)


def _require_owned_pet(db: Session, pet_id: int, user: User) -> Pet:
    """Load a pet only if it belongs to this owner; otherwise 404."""
    pet = pet_repository.find_by_id_and_owner(db, pet_id, user.id)
    if pet is None:
        raise ResourceNotFoundError("Pet", pet_id)
    return pet
