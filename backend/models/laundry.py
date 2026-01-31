from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
from enum import Enum

class MachineStatus(str, Enum):
    AVAILABLE = "Available"
    IN_USE = "In Use"
    MAINTENANCE = "Maintenance"

class LaundryMachineCreate(BaseModel):
    block: str
    floor: str
    machine_number: str
    type: str = "Washing Machine" # or "Dryer"

class LaundryMachineResponse(BaseModel):
    id: str
    block: str
    floor: str | int
    machine_number: str
    type: str
    status: MachineStatus
    current_user_id: Optional[str] = None
    current_user_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
