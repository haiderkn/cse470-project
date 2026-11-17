from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.pet import Pet


def find_by_owner(db: Session, owner_id: int) -> list[Pet]:
    stmt = (
        select(Pet)
        .where(Pet.owner_id == owner_id)
        .order_by(Pet.created_at.desc(), Pet.id.desc())
    )
    return list(db.scalars(stmt))


def find_by_id_and_owner(db: Session, pet_id: int, owner_id: int) -> Pet | None:
    return db.scalar(
        select(Pet).where(Pet.id == pet_id, Pet.owner_id == owner_id)
    )


def count_by_owner(db: Session, owner_id: int) -> int:
    return db.scalar(
        select(func.count(Pet.id)).where(Pet.owner_id == owner_id)
    ) or 0


def save(db: Session, pet: Pet) -> Pet:
    db.add(pet)
    db.commit()
    db.refresh(pet)
    return pet


def delete(db: Session, pet: Pet) -> None:
    db.delete(pet)
    db.commit()
