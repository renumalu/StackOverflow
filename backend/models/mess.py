from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class MealType(str, Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    SNACKS = "Snacks"
    DINNER = "Dinner"

class DayOfWeek(str, Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class MessMenuCreate(BaseModel):
    day: DayOfWeek
    meal_type: MealType
    items: List[str]
    special_items: Optional[List[str]] = []

class MessMenuResponse(BaseModel):
    id: str
    day: DayOfWeek
    meal_type: MealType
    items: List[str]
    special_items: List[str]
    votes_up: int = 0
    votes_down: int = 0
    voters: Dict[str, str] = {} # user_id: vote_type ('up' or 'down')
    created_at: datetime
    updated_at: datetime

class PollOption(BaseModel):
    id: str
    text: str
    votes: int = 0

class PollCreate(BaseModel):
    question: str
    options: List[str]
    expires_at: Optional[datetime] = None

class PollResponse(BaseModel):
    id: str
    question: str
    options: List[PollOption]
    created_by: str
    is_active: bool
    total_votes: int = 0
    voters: Dict[str, str] = {} # user_id: option_id
    expires_at: Optional[datetime]
    created_at: datetime
