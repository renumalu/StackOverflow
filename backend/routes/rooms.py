from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
import os
from middleware.auth import require_role

router = APIRouter(prefix="/rooms", tags=["Rooms"])

def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

@router.get("/occupancy")
async def get_room_occupancy(
    hostel: str = "Hostel-A",
    current_user: dict = Depends(require_role(["management", "admin"]))
):
    db = get_db()
    
    # 1. Define Hostel Structure (Mocked for Hackathon)
    # 3 Blocks, 3 Floors, 10 Rooms per floor
    blocks = ["Block-1", "Block-2", "Block-3"]
    floors = [1, 2, 3]
    rooms_per_floor = 10
    capacity_per_room = 2
    
    # 2. Get all students in this hostel
    pipeline = [
        {"$match": {"role": "student", "hostel": hostel}},
        {"$group": {
            "_id": {
                "block": "$block",
                "room": "$room"
            },
            "count": {"$sum": 1},
            "students": {"$push": {"name": "$name", "id": "$id"}}
        }}
    ]
    
    occupancy_data = await db.users.aggregate(pipeline).to_list(1000)
    
    # Transform to map for easy lookup
    occupancy_map = {}
    for item in occupancy_data:
        key = f"{item['_id']['block']}-{item['_id']['room']}"
        occupancy_map[key] = item
        
    # 3. Build complete room list (FLATTENED for Dashboard Grid)
    result = []
    
    for block in blocks:
        for floor in floors:
            for i in range(1, rooms_per_floor + 1):
                room_num = f"{floor}{i:02d}" # e.g., 101, 102
                key = f"{block}-{room_num}"
                
                occupied_info = occupancy_map.get(key, {"count": 0, "students": []})
                count = occupied_info["count"]
                
                status = "Available"
                if count >= capacity_per_room:
                    status = "Occupied"
                elif count > 0:
                    status = "Partial"
                    
                room_data = {
                    "id": key,
                    "block": block,
                    "floor": floor,
                    "number": room_num,
                    "capacity": capacity_per_room,
                    "occupied": count,
                    "status": status,
                    "students": occupied_info["students"]
                }
                result.append(room_data)
        
    return result
