from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LEAVE = "Leave"

class AttendanceCreate(BaseModel):
    student_id: str
    status: AttendanceStatus
    date: datetime
    remarks: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: str
    student_id: str
    student_name: str
    hostel: str
    block: str
    room: str
    date: datetime
    status: AttendanceStatus
    remarks: Optional[str] = None
    marked_by: str
    created_at: datetime
    updated_at: datetime
