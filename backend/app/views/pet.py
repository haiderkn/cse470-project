from datetime import datetime

from pydantic import Field, field_validator

from app.views.auth import CamelModel


class PetRequest(CamelModel):
    """Payload to create or update a pet profile."""

    name: str = Field(max_length=100)
    species: str = Field(max_length=50)
    breed: str | None = Field(default=None, max_length=100)
    age: str | None = Field(default=None, max_length=50)
    gender: str | None = Field(default=None, max_length=20)
    weight: str | None = Field(default=None, max_length=30)
    photo_url: str | None = Field(default=None, max_length=500)
    care_notes: str | None = Field(default=None, max_length=2000)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Pet name is required")
        return v.strip()

    @field_validator("species")
    @classmethod
    def species_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Species is required (e.g., Dog, Cat, Bird)")
        return v.strip()


class PetResponse(CamelModel):
    """Outgoing pet view for responses."""

    id: int
    name: str
    species: str
    breed: str | None
    age: str | None
    gender: str | None
    weight: str | None
    photo_url: str | None
    care_notes: str | None
    owner_id: int
    created_at: datetime
    updated_at: datetime
