from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    MANAGEMENT = "management"

class Expertise(str, Enum):
    PLUMBING = "Plumbing"
    ELECTRICAL = "Electrical"
    CARPENTRY = "Carpentry"
    CLEANING = "Cleaning"
    INTERNET = "Internet"
    GENERAL = "General"

class AssignedArea(BaseModel):
    hostel: str
    blocks: List[str]

class ShiftTiming(BaseModel):
    start: str
    end: str

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    hostel: Optional[str] = None
    block: Optional[str] = None
    room: Optional[str] = None
    profile_image: Optional[str] = None
    expertise: Optional[List[Expertise]] = None
    assigned_areas: Optional[List[AssignedArea]] = None
    shift_timing: Optional[ShiftTiming] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str]
    role: UserRole
    hostel: Optional[str]
    block: Optional[str]
    room: Optional[str]
    profile_image: Optional[str]
    is_active: bool
    email_verified: bool
    expertise: Optional[List[Expertise]]
    assigned_areas: Optional[List[AssignedArea]]
    shift_timing: Optional[ShiftTiming]
    created_at: datetime
    last_login: Optional[datetime]

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
