from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

from motor.motor_asyncio import AsyncIOMotorClient
from models.gatepass import GatePassCreate, GatePassResponse, PassStatus
from middleware.auth import get_current_user, require_role

router = APIRouter(prefix="/gatepass", tags=["Gate Pass"])

def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

@router.post("/", response_model=GatePassResponse, status_code=201)
async def apply_gate_pass(
    pass_data: GatePassCreate,
    current_user: dict = Depends(require_role(["student"]))
):
    db = get_db()
    
    # Check for active passes
    active_pass = await db.gate_passes.find_one({
        "student_id": current_user["id"],
        "status": {"$in": ["Pending", "Approved"]}
    })
    
    if active_pass:
        raise HTTPException(status_code=400, detail="You already have an active gate pass request")

    pass_id = str(uuid.uuid4())
    pass_doc = {
        "id": pass_id,
        "student_id": current_user["id"],
        "student_name": current_user["name"],
        "hostel": current_user.get("hostel", "N/A"),
        "room": f"{current_user.get('block', '')}-{current_user.get('room', '')}",
        "type": pass_data.type,
        "reason": pass_data.reason,
        "destination": pass_data.destination,
        "depart_time": pass_data.depart_time,
        "return_time": pass_data.return_time,
        "contact_number": pass_data.contact_number,
        "status": PassStatus.PENDING,
        "approved_by": None,
        "approved_by_name": None,
        "rejection_reason": None,
        "qr_code": f"GATEPASS:{pass_id}", # Simple string for QR generation on frontend
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.gate_passes.insert_one(pass_doc)
    
    # Notify management
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "recipient": "management",
        "type": "GATE_PASS_REQUEST",
        "title": "New Gate Pass Request",
        "message": f"{current_user['name']} requested {pass_data.type}",
        "related_id": pass_id,
        "link": "/management/gatepass",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return GatePassResponse(**pass_doc)

@router.get("/", response_model=List[GatePassResponse])
async def get_gate_passes(
    status: Optional[str] = None,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    filters = {}
    
    if current_user["role"] == "student":
        filters["student_id"] = current_user["id"]
    elif student_id:
        filters["student_id"] = student_id
        
    if status:
        filters["status"] = status

    passes = await db.gate_passes.find(filters, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [GatePassResponse(**p) for p in passes]

@router.patch("/{pass_id}/status", response_model=GatePassResponse)
async def update_pass_status(
    pass_id: str,
    status_update: dict,
    current_user: dict = Depends(require_role(["management"]))
):
    db = get_db()
    
    gate_pass = await db.gate_passes.find_one({"id": pass_id})
    if not gate_pass:
        raise HTTPException(status_code=404, detail="Gate pass not found")
        
    update_data = {
        "status": status_update["status"],
        "updated_at": datetime.now(timezone.utc)
    }
    
    if status_update["status"] == "Approved":
        update_data["approved_by"] = current_user["id"]
        update_data["approved_by_name"] = current_user["name"]
    elif status_update["status"] == "Rejected":
        update_data["rejection_reason"] = status_update.get("reason", "No reason provided")
        update_data["approved_by"] = current_user["id"]
        update_data["approved_by_name"] = current_user["name"]
        
    await db.gate_passes.update_one({"id": pass_id}, {"$set": update_data})
    
    # Notify student
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "recipient": gate_pass["student_id"],
        "type": "GATE_PASS_UPDATE",
        "title": f"Gate Pass {status_update['status']}",
        "message": f"Your gate pass request has been {status_update['status'].lower()}",
        "related_id": pass_id,
        "link": "/student/gatepass",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    updated_pass = await db.gate_passes.find_one({"id": pass_id}, {"_id": 0})
    return GatePassResponse(**updated_pass)
