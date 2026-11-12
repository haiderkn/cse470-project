from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from database import Base

class PetShop(Base):
    __tablename__ = "pet_shops"
    
    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String(100), nullable=False)
    owner_name = Column(String(100), nullable=False)
    contact_number = Column(String(20), nullable=False)
    address = Column(String(255), nullable=False)
    business_license_url = Column(String(255), nullable=True) 
    status = Column(Enum('pending', 'verified', 'rejected'), default='pending')
    created_at = Column(DateTime, server_default=func.now())