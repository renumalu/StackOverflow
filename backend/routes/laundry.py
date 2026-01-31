from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import os

from motor.motor_asyncio import AsyncIOMotorClient
from models.laundry import (LaundryMachineCreate, LaundryMachineResponse, MachineStatus)
from middleware.auth import get_current_user, require_role

router = APIRouter(prefix="/laundry", tags=["Laundry"])

def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

@router.post("/machines", response_model=LaundryMachineResponse, status_code=201)
async def create_machine(
    machine_data: LaundryMachineCreate,
    current_user: dict = Depends(require_role(["management", "admin"]))
):
    db = get_db()
    machine_id = str(uuid.uuid4())
    
    machine_doc = {
        "id": machine_id,
        "block": machine_data.block,
        "floor": machine_data.floor,
        "machine_number": machine_data.machine_number,
        "type": machine_data.type,
        "status": MachineStatus.AVAILABLE,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.laundry.insert_one(machine_doc)
    return LaundryMachineResponse(**machine_doc)

@router.get("/machines", response_model=List[LaundryMachineResponse])
async def get_machines(block: Optional[str] = None):
    db = get_db()
    filters = {}
    if block:
        filters["block"] = block
        
    machines = await db.laundry.find(filters, {"_id": 0}).sort([("block", 1), ("floor", 1), ("machine_number", 1)]).to_list(100)
    
    # Auto-release if time passed (simple check on read)
    # In production, use a background task
    now = datetime.now(timezone.utc)
    updated_machines = []
    
    for m in machines:
        if m.get("status") == MachineStatus.IN_USE and m.get("end_time"):
            end_time = m["end_time"].replace(tzinfo=timezone.utc) if m["end_time"].tzinfo is None else m["end_time"]
            if now > end_time:
                # Reset machine
                await db.laundry.update_one(
                    {"id": m["id"]},
                    {"$set": {
                        "status": MachineStatus.AVAILABLE,
                        "current_user_id": None,
                        "current_user_name": None,
                        "start_time": None,
                        "end_time": None
                    }}
                )
                m["status"] = MachineStatus.AVAILABLE
                m["current_user_id"] = None
                m["current_user_name"] = None
                m["start_time"] = None
                m["end_time"] = None
        updated_machines.append(LaundryMachineResponse(**m))
        
    return updated_machines

@router.post("/machines/{machine_id}/use")
async def use_machine(
    machine_id: str,
    duration_minutes: int = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    machine = await db.laundry.find_one({"id": machine_id})
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    if machine["status"] != MachineStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Machine is not available")
        
    start_time = datetime.now(timezone.utc)
    end_time = start_time + timedelta(minutes=duration_minutes)
    
    await db.laundry.update_one(
        {"id": machine_id},
        {"$set": {
            "status": MachineStatus.IN_USE,
            "current_user_id": current_user["id"],
            "current_user_name": current_user["name"],
            "start_time": start_time,
            "end_time": end_time,
            "updated_at": start_time
        }}
    )
    
    updated_machine = await db.laundry.find_one({"id": machine_id}, {"_id": 0})
    return LaundryMachineResponse(**updated_machine)

@router.post("/machines/{machine_id}/release")
async def release_machine(
    machine_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    machine = await db.laundry.find_one({"id": machine_id})
    
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    if machine.get("current_user_id") != current_user["id"] and current_user["role"] != "management":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    await db.laundry.update_one(
        {"id": machine_id},
        {"$set": {
            "status": MachineStatus.AVAILABLE,
            "current_user_id": None,
            "current_user_name": None,
            "start_time": None,
            "end_time": None,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    updated_machine = await db.laundry.find_one({"id": machine_id}, {"_id": 0})
    return LaundryMachineResponse(**updated_machine)
