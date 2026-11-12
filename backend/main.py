from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models, schemas

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PetCare BD API")

# Allow React frontend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API ENDPOINTS FOR FEATURE 19 ---

@app.post("/api/shops/register")
def register_shop(shop: schemas.ShopRegister, db: Session = Depends(get_db)):
    # Create new shop in database
    db_shop = models.PetShop(**shop.dict())
    db.add(db_shop)
    db.commit()
    db.refresh(db_shop)
    return db_shop

@app.get("/api/shops/pending")
def get_pending_shops(db: Session = Depends(get_db)):
    # Admin endpoint to see shops waiting for verification
    return db.query(models.PetShop).filter(models.PetShop.status == 'pending').all()

@app.put("/api/shops/{shop_id}/verify")
def verify_shop(shop_id: int, verification: schemas.ShopVerification, db: Session = Depends(get_db)):
    shop = db.query(models.PetShop).filter(models.PetShop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    if verification.status not in ['verified', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    shop.status = verification.status
    db.commit()
    db.refresh(shop)
    return shop