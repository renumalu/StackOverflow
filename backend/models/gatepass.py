from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class PassStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    USED = "Used"
    EXPIRED = "Expired"

class PassType(str, Enum):
    OUTING = "Outing"
    HOME = "Home Visit"
    EMERGENCY = "Emergency"
    VACATION = "Vacation"

class GatePassCreate(BaseModel):
    type: PassType
    reason: str
    destination: str
    depart_time: datetime
    return_time: datetime
    contact_number: str

class GatePassResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    hostel: str
    room: str
    type: PassType
    reason: str
    destination: str
    depart_time: datetime
    return_time: datetime
    contact_number: str
    status: PassStatus
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    qr_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
