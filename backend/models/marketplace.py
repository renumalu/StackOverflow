from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MarketplaceCategory(str, Enum):
    ELECTRONICS = "Electronics"
    BOOKS = "Books"
    FURNITURE = "Furniture"
    CLOTHING = "Clothing"
    ACCESSORIES = "Accessories"
    STATIONERY = "Stationery"
    OTHERS = "Others"

class MarketplaceStatus(str, Enum):
    AVAILABLE = "Available"
    SOLD = "Sold"
    RESERVED = "Reserved"

class MarketplaceCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10)
    price: float = Field(..., ge=0)
    category: MarketplaceCategory
    condition: str = Field(..., description="New, Like New, Good, Fair, Poor")
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class MediaItem(BaseModel):
    url: str
    public_id: Optional[str] = None

class MarketplaceResponse(BaseModel):
    id: str
    seller_id: str
    seller_name: str
    title: str
    description: str
    price: float
    category: MarketplaceCategory
    condition: str
    status: MarketplaceStatus
    media: List[MediaItem] = []
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
