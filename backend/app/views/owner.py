from datetime import datetime

from pydantic import Field, field_validator

from app.views.auth import CamelModel


class OwnerProfileResponse(CamelModel):
    """Profile data for the pet owner."""

    id: int
    name: str
    email: str
    role: str
    phone: str | None = None
    address: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    emergency_contact: str | None = None
    total_pets: int = 0
    created_at: datetime


class OwnerProfileUpdate(CamelModel):
    """Payload to update the owner's profile."""

    name: str = Field(max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None, max_length=1000)
    avatar_url: str | None = Field(default=None, max_length=500)
    emergency_contact: str | None = Field(default=None, max_length=100)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()
