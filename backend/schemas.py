from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ShopRegister(BaseModel):
    shop_name: str
    owner_name: str
    contact_number: str
    address: str

class ShopResponse(BaseModel):
    id: int
    shop_name: str
    owner_name: str
    contact_number: str
    address: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ShopVerification(BaseModel):
    status: str 