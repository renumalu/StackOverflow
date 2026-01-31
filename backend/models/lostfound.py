from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class LostFoundType(str, Enum):
    LOST = "lost"
    FOUND = "found"

class LostFoundCategory(str, Enum):
    ELECTRONICS = "Electronics"
    DOCUMENTS = "Documents"
    CLOTHING = "Clothing"
    ACCESSORIES = "Accessories"
    BOOKS = "Books"
    KEYS = "Keys"
    OTHERS = "Others"

class LostFoundStatus(str, Enum):
    OPEN = "Open"
    MATCHED = "Matched"
    CLAIMED = "Claimed"
    RETURNED = "Returned"
    CLOSED = "Closed"

class LostFoundLocation(BaseModel):
    hostel: Optional[str] = None
    block: Optional[str] = None
    specific_place: Optional[str] = None

class ContactInfo(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    preferred_contact: str = "email"

class MediaItem(BaseModel):
    url: str
    public_id: Optional[str] = None

class LostFoundCreate(BaseModel):
    type: LostFoundType
    item_name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10)
    category: LostFoundCategory
    location: LostFoundLocation = Field(default_factory=LostFoundLocation)
    last_seen_date: Optional[datetime] = None
    contact_info: ContactInfo = Field(default_factory=ContactInfo)

class LostFoundResponse(BaseModel):
    id: str
    reporter: str
    reporter_name: str
    type: LostFoundType
    item_name: str
    description: str
    category: LostFoundCategory
    location: LostFoundLocation
    date_reported: datetime
    last_seen_date: Optional[datetime]
    status: LostFoundStatus
    media: List[MediaItem] = []
    contact_info: ContactInfo
    matched_with: Optional[str] = None
    claimant: Optional[str] = None
    verification_verified: bool = False
    verification_verified_by: Optional[str] = None
    verification_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class AIMessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"

class AIMessage(BaseModel):
    role: AIMessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AIConversationCreate(BaseModel):
    message: str
    context: Optional[dict] = None

class AIConversationResponse(BaseModel):
    session_id: str
    messages: List[AIMessage]
    response: str
