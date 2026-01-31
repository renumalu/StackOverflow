from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class IssueCategory(str, Enum):
    PLUMBING = "Plumbing"
    ELECTRICAL = "Electrical"
    CLEANLINESS = "Cleanliness"
    INTERNET = "Internet"
    FURNITURE = "Furniture"
    SECURITY = "Security"
    OTHERS = "Others"

class IssuePriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    EMERGENCY = "Emergency"

class IssueStatus(str, Enum):
    REPORTED = "Reported"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"

class IssueVisibility(str, Enum):
    PUBLIC = "Public"
    PRIVATE = "Private"

class MediaItem(BaseModel):
    url: str
    public_id: Optional[str] = None
    file_type: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class Location(BaseModel):
    hostel: str
    block: str
    room: str

class StatusHistoryItem(BaseModel):
    old_status: Optional[IssueStatus]
    new_status: IssueStatus
    updated_by: Optional[str] = None
    updated_by_name: Optional[str] = None
    remarks: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_role: str
    text: str
    parent_comment: Optional[str] = None
    likes: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AIPredictions(BaseModel):
    category: Optional[str] = None
    priority: Optional[str] = None
    confidence_score: Optional[float] = None
    estimated_resolution_hours: Optional[float] = None

class Resolution(BaseModel):
    resolved_by: Optional[str] = None
    resolved_by_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_media: Optional[List[MediaItem]] = []
    resolved_at: Optional[datetime] = None

class Feedback(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
    submitted_at: Optional[datetime] = None

class IssueCreate(BaseModel):
    category: IssueCategory
    priority: IssuePriority
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    visibility: IssueVisibility = IssueVisibility.PUBLIC

class IssueUpdate(BaseModel):
    status: Optional[IssueStatus] = None
    assigned_to: Optional[str] = None
    priority: Optional[IssuePriority] = None
    remarks: Optional[str] = None

class IssueResponse(BaseModel):
    id: str
    ticket_id: str
    reporter_id: str
    reporter_name: str
    reporter_email: str
    category: IssueCategory
    priority: IssuePriority
    title: str
    description: str
    status: IssueStatus
    visibility: IssueVisibility
    location: Optional[Location] = None
    media: List[MediaItem] = []
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    ai_predictions: Optional[AIPredictions] = None
    status_history: List[StatusHistoryItem] = []
    comments: List[Comment] = []
    resolution: Optional[Resolution] = None
    feedback: Optional[Feedback] = None
    reported_at: datetime
    closed_at: Optional[datetime] = None
    is_duplicate: bool = False
    merged_with: Optional[str] = None
    merged_issues: List[str] = []
    views: int = 0
    upvotes: List[str] = []
    created_at: datetime
    updated_at: datetime

class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    parent_comment: Optional[str] = None

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
