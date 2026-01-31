from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

from motor.motor_asyncio import AsyncIOMotorClient
from models.attendance import AttendanceCreate, AttendanceResponse, AttendanceStatus
from middleware.auth import get_current_user, require_role

router = APIRouter(prefix="/attendance", tags=["Attendance"])

def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

@router.post("/", response_model=AttendanceResponse, status_code=201)
async def mark_attendance(
    attendance_data: AttendanceCreate,
    current_user: dict = Depends(require_role(["management", "admin"]))
):
    db = get_db()
    
    # Verify student exists
    student = await db.users.find_one({"id": attendance_data.student_id, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if already marked for this date
    start_of_day = attendance_data.date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = attendance_data.date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    existing = await db.attendance.find_one({
        "student_id": attendance_data.student_id,
        "date": {"$gte": start_of_day, "$lte": end_of_day}
    })
    
    if existing:
        # Update existing
        await db.attendance.update_one(
            {"id": existing["id"]},
            {"$set": {
                "status": attendance_data.status,
                "remarks": attendance_data.remarks,
                "marked_by": current_user["id"],
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        updated = await db.attendance.find_one({"id": existing["id"]}, {"_id": 0})
        return AttendanceResponse(**updated)

    attendance_id = str(uuid.uuid4())
    attendance_doc = {
        "id": attendance_id,
        "student_id": attendance_data.student_id,
        "student_name": student["name"],
        "hostel": student.get("hostel", "N/A"),
        "block": student.get("block", "N/A"),
        "room": student.get("room", "N/A"),
        "date": attendance_data.date,
        "status": attendance_data.status,
        "remarks": attendance_data.remarks,
        "marked_by": current_user["id"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.attendance.insert_one(attendance_doc)
    return AttendanceResponse(**attendance_doc)

@router.get("/", response_model=List[AttendanceResponse])
async def get_attendance(
    student_id: Optional[str] = None,
    date: Optional[datetime] = None,
    hostel: Optional[str] = None,
    current_user: dict = Depends(require_role(["management", "admin", "student"]))
):
    db = get_db()
    filters = {}
    
    if current_user["role"] == "student":
        # Students can only see their own attendance
        if student_id and student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Cannot view other students' attendance")
        filters["student_id"] = current_user["id"]
    elif student_id:
        filters["student_id"] = student_id
        
    if date:
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = date.replace(hour=23, minute=59, second=59, microsecond=999999)
        filters["date"] = {"$gte": start_of_day, "$lte": end_of_day}
        
    if hostel:
        filters["hostel"] = hostel

    attendance = await db.attendance.find(filters, {"_id": 0}).sort("date", -1).to_list(100)
    return [AttendanceResponse(**a) for a in attendance]

@router.get("/stats/{student_id}")
async def get_attendance_stats(
    student_id: str,
    current_user: dict = Depends(require_role(["management", "admin", "student"]))
):
    if current_user["role"] == "student" and student_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db = get_db()
    
    pipeline = [
        {"$match": {"student_id": student_id}},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    stats = await db.attendance.aggregate(pipeline).to_list(None)
    
    result = {
        "Present": 0,
        "Absent": 0,
        "Leave": 0,
        "Total": 0,
        "AttendancePercentage": 0
    }
    
    total = 0
    present = 0
    
    for s in stats:
        result[s["_id"]] = s["count"]
        total += s["count"]
        if s["_id"] == "Present":
            present = s["count"]
            
    result["Total"] = total
    if total > 0:
        result["AttendancePercentage"] = round((present / total) * 100, 1)
        
    return result
