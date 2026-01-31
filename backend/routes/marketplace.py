from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

from motor.motor_asyncio import AsyncIOMotorClient
from models.marketplace import (MarketplaceCreate, MarketplaceResponse, MarketplaceStatus, 
                                MarketplaceCategory, MediaItem)
from middleware.auth import get_current_user, require_role
from utils.cloudinary_utils import upload_file

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

# Helper to get DB
def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

@router.post("/", response_model=MarketplaceResponse, status_code=201)
async def create_listing(
    listing_data: MarketplaceCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    listing_id = str(uuid.uuid4())
    
    listing_doc = {
        "id": listing_id,
        "seller_id": current_user["id"],
        "seller_name": current_user["name"],
        "title": listing_data.title,
        "description": listing_data.description,
        "price": listing_data.price,
        "category": listing_data.category,
        "condition": listing_data.condition,
        "status": MarketplaceStatus.AVAILABLE,
        "media": [],
        "contact_phone": listing_data.contact_phone,
        "contact_email": listing_data.contact_email or current_user["email"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.marketplace.insert_one(listing_doc)
    return MarketplaceResponse(**listing_doc)

@router.get("/", response_model=List[MarketplaceResponse])
async def get_listings(
    category: Optional[MarketplaceCategory] = None,
    status: Optional[MarketplaceStatus] = MarketplaceStatus.AVAILABLE,
    search: Optional[str] = None
):
    db = get_db()
    filters = {}
    
    if status:
        filters["status"] = status
    if category:
        filters["category"] = category
    if search:
        filters["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
        
    listings = await db.marketplace.find(filters, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [MarketplaceResponse(**l) for l in listings]

@router.get("/{listing_id}", response_model=MarketplaceResponse)
async def get_listing(listing_id: str):
    db = get_db()
    listing = await db.marketplace.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return MarketplaceResponse(**listing)

@router.put("/{listing_id}/status")
async def update_status(
    listing_id: str,
    status: MarketplaceStatus,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    listing = await db.marketplace.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["seller_id"] != current_user["id"] and current_user["role"] != "management":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    await db.marketplace.update_one(
        {"id": listing_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    updated_listing = await db.marketplace.find_one({"id": listing_id}, {"_id": 0})
    return MarketplaceResponse(**updated_listing)

@router.post("/{listing_id}/upload", response_model=dict)
async def upload_listing_image(
    listing_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    listing = await db.marketplace.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    if listing["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await upload_file(file)
    if not result:
        raise HTTPException(status_code=500, detail="Upload failed")
        
    media_item = {
        "url": result["secure_url"],
        "public_id": result["public_id"]
    }
    
    await db.marketplace.update_one(
        {"id": listing_id},
        {"$push": {"media": media_item}}
    )
    
    return {"url": result["secure_url"]}
