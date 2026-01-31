from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AnnouncementPriority(str, Enum):
    NORMAL = "Normal"
    IMPORTANT = "Important"
    URGENT = "Urgent"

class AnnouncementCategory(str, Enum):
    MAINTENANCE = "Maintenance"
    SCHEDULE = "Schedule"
    ALERT = "Alert"
    GENERAL = "General"
    EVENT = "Event"

class TargetBlock(BaseModel):
    hostel: str
    block: str

class TargetAudience(BaseModel):
    hostels: Optional[List[str]] = []
    blocks: Optional[List[TargetBlock]] = []
    roles: Optional[List[str]] = []

class ReadBy(BaseModel):
    user: str
    read_at: datetime = Field(default_factory=datetime.utcnow)

class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    priority: AnnouncementPriority = AnnouncementPriority.NORMAL
    category: AnnouncementCategory = AnnouncementCategory.GENERAL
    target_audience: TargetAudience = Field(default_factory=TargetAudience)
    is_pinned: bool = False
    expires_at: Optional[datetime] = None

class AnnouncementResponse(BaseModel):
    id: str
    title: str
    description: str
    priority: AnnouncementPriority
    category: AnnouncementCategory
    target_audience: TargetAudience
    created_by: str
    created_by_name: str
    is_pinned: bool
    valid_from: datetime
    expires_at: Optional[datetime] = None
    read_by: List[ReadBy] = []
    created_at: datetime
    updated_at: datetime

class NotificationType(str, Enum):
    NEW_ISSUE = "NEW_ISSUE"
    ISSUE_ASSIGNED = "ISSUE_ASSIGNED"
    STATUS_UPDATE = "STATUS_UPDATE"
    NEW_COMMENT = "NEW_COMMENT"
    ISSUE_RESOLVED = "ISSUE_RESOLVED"
    ANNOUNCEMENT = "ANNOUNCEMENT"
    ESCALATION = "ESCALATION"
    REMINDER = "REMINDER"

class NotificationCreate(BaseModel):
    recipient: str
    type: NotificationType
    title: str
    message: str
    related_issue: Optional[str] = None
    related_announcement: Optional[str] = None
    link: Optional[str] = None
    priority: str = "Medium"

class NotificationResponse(BaseModel):
    id: str
    recipient: str
    type: NotificationType
    title: str
    message: str
    related_issue: Optional[str]
    related_announcement: Optional[str]
    link: Optional[str]
    is_read: bool
    read_at: Optional[datetime]
    priority: str
    created_at: datetime
