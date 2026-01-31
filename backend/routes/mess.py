from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

from motor.motor_asyncio import AsyncIOMotorClient
from models.mess import (MessMenuCreate, MessMenuResponse, DayOfWeek, MealType, 
                         PollCreate, PollResponse, PollOption)
from middleware.auth import get_current_user, require_role

router = APIRouter(prefix="/mess", tags=["Mess"])

def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

@router.post("/menu", response_model=MessMenuResponse, status_code=201)
async def create_menu_item(
    menu_data: MessMenuCreate,
    current_user: dict = Depends(require_role(["management", "admin"]))
):
    db = get_db()
    
    # Check if menu exists for this day/meal
    existing = await db.mess_menu.find_one({
        "day": menu_data.day,
        "meal_type": menu_data.meal_type
    })
    
    if existing:
        # Update existing
        await db.mess_menu.update_one(
            {"id": existing["id"]},
            {"$set": {
                "items": menu_data.items,
                "special_items": menu_data.special_items,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        updated = await db.mess_menu.find_one({"id": existing["id"]}, {"_id": 0})
        return MessMenuResponse(**updated)
    
    menu_id = str(uuid.uuid4())
    menu_doc = {
        "id": menu_id,
        "day": menu_data.day,
        "meal_type": menu_data.meal_type,
        "items": menu_data.items,
        "special_items": menu_data.special_items,
        "votes_up": 0,
        "votes_down": 0,
        "voters": {},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.mess_menu.insert_one(menu_doc)
    return MessMenuResponse(**menu_doc)

@router.get("/menu", response_model=List[MessMenuResponse])
async def get_menu(day: Optional[DayOfWeek] = None):
    db = get_db()
    filters = {}
    if day:
        filters["day"] = day
        
    menu = await db.mess_menu.find(filters, {"_id": 0}).to_list(100)
    return [MessMenuResponse(**m) for m in menu]

@router.post("/menu/{menu_id}/vote")
async def vote_menu(
    menu_id: str,
    vote_type: str = Body(..., embed=True), # "up" or "down"
    current_user: dict = Depends(get_current_user)
):
    if vote_type not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
        
    db = get_db()
    menu = await db.mess_menu.find_one({"id": menu_id})
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
        
    user_id = current_user["id"]
    voters = menu.get("voters", {})
    
    # Remove previous vote if exists
    previous_vote = voters.get(user_id)
    
    update_query = {}
    
    if previous_vote == vote_type:
        # Toggle off (remove vote)
        del voters[user_id]
        if vote_type == "up":
            update_query["$inc"] = {"votes_up": -1}
        else:
            update_query["$inc"] = {"votes_down": -1}
    else:
        # Change vote or new vote
        if previous_vote:
            # Reverse previous count
            if previous_vote == "up":
                update_query.setdefault("$inc", {})["votes_up"] = -1
            else:
                update_query.setdefault("$inc", {})["votes_down"] = -1
        
        # Add new vote
        voters[user_id] = vote_type
        if vote_type == "up":
            update_query.setdefault("$inc", {})["votes_up"] = update_query.get("$inc", {}).get("votes_up", 0) + 1
        else:
            update_query.setdefault("$inc", {})["votes_down"] = update_query.get("$inc", {}).get("votes_down", 0) + 1
            
    update_query["$set"] = {"voters": voters}
    
    await db.mess_menu.update_one({"id": menu_id}, update_query)
    
    updated_menu = await db.mess_menu.find_one({"id": menu_id}, {"_id": 0})
    return MessMenuResponse(**updated_menu)

@router.post("/polls", response_model=PollResponse, status_code=201)
async def create_poll(
    poll_data: PollCreate,
    current_user: dict = Depends(require_role(["management", "admin"]))
):
    db = get_db()
    poll_id = str(uuid.uuid4())
    
    options = []
    for opt_text in poll_data.options:
        options.append({
            "id": str(uuid.uuid4()),
            "text": opt_text,
            "votes": 0
        })
        
    poll_doc = {
        "id": poll_id,
        "question": poll_data.question,
        "options": options,
        "created_by": current_user["id"],
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "expires_at": poll_data.expires_at,
        "total_votes": 0,
        "voters": {}  # Map user_id -> option_id
    }
    
    await db.polls.insert_one(poll_doc)
    return PollResponse(**poll_doc)

@router.get("/polls", response_model=List[PollResponse])
async def get_polls(
    active_only: bool = True,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {}
    if active_only:
        query["is_active"] = True
        
    polls = await db.polls.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [PollResponse(**p) for p in polls]

@router.post("/polls/{poll_id}/vote")
async def vote_poll(
    poll_id: str,
    vote_data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    option_id = vote_data.get("option_id")
    if not option_id:
        raise HTTPException(status_code=400, detail="Option ID required")
        
    db = get_db()
    poll = await db.polls.find_one({"id": poll_id})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
        
    if not poll["is_active"]:
        raise HTTPException(status_code=400, detail="Poll is closed")
        
    user_id = current_user["id"]
    voters = poll.get("voters", {})
    
    if user_id in voters:
        raise HTTPException(status_code=400, detail="Already voted")
        
    # Find option index
    options = poll["options"]
    option_index = next((i for i, o in enumerate(options) if o["id"] == option_id), -1)
    
    if option_index == -1:
        raise HTTPException(status_code=404, detail="Option not found")
        
    # Update vote
    await db.polls.update_one(
        {"id": poll_id},
        {
            "$inc": {
                f"options.{option_index}.votes": 1,
                "total_votes": 1
            },
            "$set": {
                f"voters.{user_id}": option_id
            }
        }
    )
    
    updated_poll = await db.polls.find_one({"id": poll_id}, {"_id": 0})
    return PollResponse(**updated_poll)
