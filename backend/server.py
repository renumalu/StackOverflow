from fastapi import FastAPI, APIRouter, File, UploadFile, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from datetime import datetime, timezone
import uuid
from typing import List, Optional

from models.user import UserResponse
from models.issue import (IssueCreate, IssueResponse, IssueUpdate, CommentCreate, 
                          FeedbackCreate, MediaItem, Location, StatusHistoryItem, 
                          Comment, IssueStatus, IssuePriority, IssueCategory)
from models.announcement import (AnnouncementCreate, AnnouncementResponse, 
                                  NotificationCreate, NotificationResponse)
from models.lostfound import LostFoundCreate, LostFoundResponse, LostFoundStatus
from middleware.auth import get_current_user, require_role
from utils.ticket_generator import generate_ticket_id
from utils.cloudinary_utils import upload_file
from services.ai_service import ai_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Hostel Management System")

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add CORS middleware FIRST before any routes
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============= AUTH ROUTES =============
from routes.auth import router as auth_router
from routes.marketplace import router as marketplace_router
from routes.mess import router as mess_router
from routes.laundry import router as laundry_router
from routes.attendance import router as attendance_router
from routes.gatepass import router as gatepass_router
from routes.rooms import router as rooms_router

api_router.include_router(auth_router)
api_router.include_router(marketplace_router)
api_router.include_router(mess_router)
api_router.include_router(laundry_router)
api_router.include_router(attendance_router)
api_router.include_router(gatepass_router)
api_router.include_router(rooms_router)

# ============= ISSUE ROUTES =============
issue_router = APIRouter(prefix="/issues", tags=["Issues"])

@issue_router.post("/", response_model=IssueResponse, status_code=201)
async def create_issue(
    issue_data: IssueCreate,
    current_user: dict = Depends(get_current_user)
):
    user = current_user
    ticket_id = generate_ticket_id()
    issue_id = str(uuid.uuid4())
    
    ai_predictions = None
    try:
        prediction = await ai_service.predict_issue_category(issue_data.title, issue_data.description)
        ai_predictions = {
            "category": prediction.get("category"),
            "priority": prediction.get("priority"),
            "confidence_score": prediction.get("confidence"),
            "estimated_resolution_hours": prediction.get("estimated_hours")
        }
    except Exception as e:
        logger.error(f"AI prediction failed: {e}")
    
    issue_doc = {
        "id": issue_id,
        "ticket_id": ticket_id,
        "reporter_id": user["id"],
        "reporter_name": user["name"],
        "reporter_email": user["email"],
        "category": issue_data.category,
        "priority": issue_data.priority,
        "title": issue_data.title,
        "description": issue_data.description,
        "status": IssueStatus.REPORTED,
        "visibility": issue_data.visibility,
        "location": {
            "hostel": user.get("hostel", "N/A"),
            "block": user.get("block", "N/A"),
            "room": user.get("room", "N/A")
        },
        "media": [],
        "assigned_to": None,
        "assigned_to_name": None,
        "ai_predictions": ai_predictions,
        "status_history": [{
            "old_status": None,
            "new_status": IssueStatus.REPORTED,
            "updated_by": user["id"],
            "updated_by_name": user["name"],
            "remarks": "Issue reported",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }],
        "comments": [],
        "resolution": None,
        "feedback": None,
        "reported_at": datetime.now(timezone.utc).isoformat(),
        "closed_at": None,
        "is_duplicate": False,
        "merged_with": None,
        "merged_issues": [],
        "views": 0,
        "upvotes": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.issues.insert_one(issue_doc)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "recipient": "management",
        "type": "NEW_ISSUE",
        "title": "New Issue Reported",
        "message": f"{issue_data.category} issue reported in {user.get('hostel', 'N/A')}",
        "related_issue": issue_id,
        "link": f"/issues/{issue_id}",
        "is_read": False,
        "priority": issue_data.priority,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return IssueResponse(**issue_doc)

@issue_router.get("/", response_model=List[IssueResponse])
async def get_issues(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if priority:
        query["priority"] = priority
    
    if current_user["role"] == "student":
        query["$or"] = [
            {"reporter_id": current_user["id"]},
            {"visibility": "Public", "location.hostel": current_user.get("hostel")}
        ]
    
    skip = (page - 1) * limit
    issues = await db.issues.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [IssueResponse(**issue) for issue in issues]

@issue_router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: str, current_user: dict = Depends(get_current_user)):
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    await db.issues.update_one({"id": issue_id}, {"$inc": {"views": 1}})
    issue["views"] += 1
    
    return IssueResponse(**issue)

@issue_router.patch("/{issue_id}/status", response_model=IssueResponse)
async def update_issue_status(
    issue_id: str,
    update_data: IssueUpdate,
    current_user: dict = Depends(get_current_user)
):
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    if current_user["role"] != "management":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {}
    if update_data.status:
        update_dict["status"] = update_data.status
        history_item = {
            "old_status": issue["status"],
            "new_status": update_data.status,
            "updated_by": current_user["id"],
            "updated_by_name": current_user["name"],
            "remarks": update_data.remarks,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.issues.update_one(
            {"id": issue_id},
            {"$push": {"status_history": history_item}}
        )
        
        if update_data.status == IssueStatus.RESOLVED:
            # We need to construct the full resolution object because 'resolution' is initially None (null)
            # and MongoDB cannot update nested fields of a null field.
            current_resolution = issue.get("resolution") or {}
            
            update_dict["resolution"] = {
                "resolved_at": datetime.now(timezone.utc).isoformat(),
                "resolved_by": current_user["id"],
                "resolved_by_name": current_user["name"],
                "resolution_notes": current_resolution.get("resolution_notes"),
                "resolution_media": current_resolution.get("resolution_media", [])
            }
        elif update_data.status == IssueStatus.CLOSED:
            update_dict["closed_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data.assigned_to:
        assignee = await db.users.find_one({"id": update_data.assigned_to}, {"_id": 0})
        if assignee:
            update_dict["assigned_to"] = update_data.assigned_to
            update_dict["assigned_to_name"] = assignee["name"]
    
    if update_data.priority:
        update_dict["priority"] = update_data.priority
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.issues.update_one({"id": issue_id}, {"$set": update_dict})
    
    updated_issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    return IssueResponse(**updated_issue)

@issue_router.post("/{issue_id}/comments", response_model=Comment)
async def add_comment(
    issue_id: str,
    comment_data: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    comment_id = str(uuid.uuid4())
    comment = {
        "id": comment_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "user_role": current_user["role"],
        "text": comment_data.text,
        "parent_comment": comment_data.parent_comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.issues.update_one({"id": issue_id}, {"$push": {"comments": comment}})
    
    return Comment(**comment)

@issue_router.post("/{issue_id}/comments/{comment_id}/like")
async def like_comment(
    issue_id: str,
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Toggle like on a comment"""
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Find the comment in the issue
    comments = issue.get("comments", [])
    comment_index = next((i for i, c in enumerate(comments) if c["id"] == comment_id), -1)
    
    if comment_index == -1:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment = comments[comment_index]
    likes = comment.get("likes", [])
    user_id = current_user["id"]
    
    if user_id in likes:
        # Unlike
        likes.remove(user_id)
        await db.issues.update_one(
            {"id": issue_id, "comments.id": comment_id},
            {"$pull": {"comments.$.likes": user_id}}
        )
    else:
        # Like
        likes.append(user_id)
        await db.issues.update_one(
            {"id": issue_id, "comments.id": comment_id},
            {"$addToSet": {"comments.$.likes": user_id}}
        )
    
    return {"likes_count": len(likes), "has_liked": user_id in likes}

@issue_router.post("/{issue_id}/upload", response_model=dict)
async def upload_issue_media(
    issue_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    if issue["reporter_id"] != current_user["id"] and current_user["role"] != "management":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    file_content = await file.read()
    upload_result = await upload_file(file_content, folder="hostel-issues")
    
    if not upload_result:
        raise HTTPException(status_code=500, detail="File upload failed")
    
    media_item = {
        "url": upload_result["url"],
        "public_id": upload_result["public_id"],
        "file_type": upload_result["file_type"],
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.issues.update_one({"id": issue_id}, {"$push": {"media": media_item}})
    
    return media_item

@issue_router.post("/{issue_id}/upvote")
async def upvote_issue(
    issue_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Add or remove upvote for an issue"""
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    user_id = current_user["id"]
    upvotes = issue.get("upvotes", [])
    
    if user_id in upvotes:
        # Remove upvote
        await db.issues.update_one({"id": issue_id}, {"$pull": {"upvotes": user_id}})
        upvotes.remove(user_id)
    else:
        # Add upvote
        await db.issues.update_one({"id": issue_id}, {"$push": {"upvotes": user_id}})
        upvotes.append(user_id)
    
    return {"upvote_count": len(upvotes), "has_upvoted": user_id in upvotes}

@issue_router.get("/analytics/by-hostel/{hostel}")
async def get_issues_by_hostel(
    hostel: str,
    current_user: dict = Depends(require_role(["management"]))
):
    """Get issues breakdown by block for a specific hostel"""
    pipeline = [
        {"$match": {
            "location.hostel": hostel,
            "visibility": "Public"
        }},
        {"$group": {
            "_id": {
                "block": "$location.block",
                "status": "$status"
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.block": 1, "_id.status": 1}}
    ]
    
    results = await db.issues.aggregate(pipeline).to_list(100)
    return {"hostel": hostel, "data": results}

@issue_router.get("/search")
async def search_issues(
    query: str = None,
    category: str = None,
    priority: str = None,
    status: str = None,
    visibility: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Search and filter issues with multiple criteria"""
    filters = {}
    
    if query:
        filters["$or"] = [
            {"title": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
            {"ticket_id": {"$regex": query, "$options": "i"}}
        ]
    
    if category:
        filters["category"] = category
    if priority:
        filters["priority"] = priority
    if status:
        filters["status"] = status
    if visibility:
        filters["visibility"] = visibility
    
    # Apply role-based filtering
    if current_user["role"] == "student":
        if "visibility" not in filters:
            filters["$or"] = [
                {"reporter_id": current_user["id"]},
                {"visibility": "Public", "location.hostel": current_user.get("hostel")}
            ]
        else:
            filters["reporter_id"] = current_user["id"]
    
    issues = await db.issues.find(filters, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return [IssueResponse(**issue) for issue in issues]

api_router.include_router(issue_router)

# ============= USER ROUTES =============
user_router = APIRouter(prefix="/users", tags=["Users"])

@user_router.get("/staff", response_model=List[UserResponse])
async def get_staff_members(current_user: dict = Depends(require_role(["management"]))):
    """Get all staff members (management role)"""
    staff = await db.users.find({"role": "management"}, {"_id": 0}).to_list(100)
    return [UserResponse(**user) for user in staff]

@user_router.get("/students", response_model=List[UserResponse])
async def get_students(
    hostel: Optional[str] = None,
    current_user: dict = Depends(require_role(["management"]))
):
    """Get all students"""
    filters = {"role": "student"}
    if hostel:
        filters["hostel"] = hostel
        
    students = await db.users.find(filters, {"_id": 0}).to_list(200)
    return [UserResponse(**user) for user in students]

api_router.include_router(user_router)

# ============= ANNOUNCEMENT ROUTES =============
announcement_router = APIRouter(prefix="/announcements", tags=["Announcements"])

@announcement_router.post("/", response_model=AnnouncementResponse, status_code=201)
async def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: dict = Depends(require_role(["management"]))
):
    announcement_id = str(uuid.uuid4())
    announcement_doc = {
        "id": announcement_id,
        "title": announcement_data.title,
        "description": announcement_data.description,
        "priority": announcement_data.priority,
        "category": announcement_data.category,
        "target_audience": announcement_data.target_audience.model_dump(),
        "created_by": current_user["id"],
        "created_by_name": current_user["name"],
        "is_pinned": announcement_data.is_pinned,
        "valid_from": datetime.now(timezone.utc).isoformat(),
        "expires_at": announcement_data.expires_at.isoformat() if announcement_data.expires_at else None,
        "read_by": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.announcements.insert_one(announcement_doc)
    return AnnouncementResponse(**announcement_doc)

@announcement_router.get("/", response_model=List[AnnouncementResponse])
async def get_announcements(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    
    # Base query for valid announcements
    base_query = {
        "valid_from": {"$lte": now},
        "$or": [
            {"expires_at": None},
            {"expires_at": {"$gte": now}}
        ]
    }
    
    # Build targeting query based on user role and location
    target_query_or = [
        {"target_audience.roles": {"$size": 0}},  # Announcements with empty roles apply to all
        {"target_audience.roles": current_user["role"]}  # Or announcements targeting user's role
    ]
    
    # If user is student, add hostel-specific announcements
    if current_user["role"] == "student":
        user_hostel = current_user.get("hostel")
        user_block = current_user.get("block")
        
        target_query_or.extend([
            {"target_audience.hostels": {"$size": 0}, "target_audience.blocks": {"$size": 0}},  # Apply to all
            {"target_audience.hostels": user_hostel},  # Hostel-specific
            {
                "target_audience.blocks": {
                    "$elemMatch": {
                        "hostel": user_hostel,
                        "block": user_block
                    }
                }
            }  # Block-specific
        ])
    
    base_query["$or"].append({"$or": target_query_or})
    
    announcements = await db.announcements.find(base_query, {"_id": 0}).sort([("is_pinned", -1), ("created_at", -1)]).to_list(100)
    return [AnnouncementResponse(**ann) for ann in announcements]

api_router.include_router(announcement_router)

# ============= NOTIFICATION ROUTES =============
notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])

@notification_router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    query = {"recipient": current_user["id"]}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return [NotificationResponse(**notif) for notif in notifications]

@notification_router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    result = await db.notifications.update_one(
        {"id": notification_id, "recipient": current_user["id"]},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

api_router.include_router(notification_router)

# ============= AI ASSISTANT ROUTES =============
ai_router = APIRouter(prefix="/ai", tags=["AI Assistant"])

@ai_router.post("/chat")
async def chat_with_ai(
    message: dict,
    current_user: dict = Depends(get_current_user)
):
    user_message = message.get("message", "")
    session_id = message.get("session_id", str(uuid.uuid4()))
    
    user_context = {
        "role": current_user["role"],
        "name": current_user["name"],
        "hostel": current_user.get("hostel", "N/A")
    }
    
    response = await ai_service.get_chat_response(session_id, user_message, user_context)
    
    conversation_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "session_id": session_id,
        "messages": [
            {"role": "user", "content": user_message, "timestamp": datetime.now(timezone.utc).isoformat()},
            {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()}
        ],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ai_conversations.insert_one(conversation_doc)
    
    return {"session_id": session_id, "response": response}

api_router.include_router(ai_router)

# ============= LOST & FOUND ROUTES =============
lostfound_router = APIRouter(prefix="/lost-found", tags=["Lost & Found"])

@lostfound_router.post("/", response_model=LostFoundResponse, status_code=201)
async def create_lostfound(
    item_data: LostFoundCreate,
    current_user: dict = Depends(get_current_user)
):
    item_id = str(uuid.uuid4())
    item_doc = {
        "id": item_id,
        "reporter": current_user["id"],
        "reporter_name": current_user["name"],
        "type": item_data.type,
        "item_name": item_data.item_name,
        "description": item_data.description,
        "category": item_data.category,
        "location": item_data.location.model_dump(),
        "date_reported": datetime.now(timezone.utc).isoformat(),
        "last_seen_date": item_data.last_seen_date.isoformat() if item_data.last_seen_date else None,
        "status": LostFoundStatus.OPEN,
        "media": [],
        "contact_info": item_data.contact_info.model_dump(),
        "matched_with": None,
        "claimant": None,
        "verification_verified": False,
        "verification_verified_by": None,
        "verification_verified_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.lost_found.insert_one(item_doc)
    return LostFoundResponse(**item_doc)

@lostfound_router.get("/", response_model=List[LostFoundResponse])
async def get_lostfound_items(
    type: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    
    items = await db.lost_found.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [LostFoundResponse(**item) for item in items]

@lostfound_router.post("/{item_id}/claim")
async def claim_item(
    item_id: str,
    claim_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Student claims a found item or management verifies claim"""
    item = await db.lost_found.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item["status"] == "Claimed":
        raise HTTPException(status_code=400, detail="Item already claimed")
    
    # Add claim
    await db.lost_found.update_one(
        {"id": item_id},
        {
            "$set": {
                "claimant": current_user["id"],
                "claimant_name": current_user["name"],
                "claim_timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "Matched" if current_user["role"] == "student" else "Claimed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    updated_item = await db.lost_found.find_one({"id": item_id}, {"_id": 0})
    return LostFoundResponse(**updated_item)

@lostfound_router.patch("/{item_id}/verify")
async def verify_claim(
    item_id: str,
    verification_data: dict,
    current_user: dict = Depends(require_role(["management"]))
):
    """Management verifies a claim"""
    item = await db.lost_found.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    verified = verification_data.get("verified", False)
    
    update_data = {
        "verification_verified": verified,
        "verification_verified_by": current_user["id"],
        "verification_verified_at": datetime.now(timezone.utc).isoformat(),
        "status": "Returned" if verified else "Open",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.lost_found.update_one({"id": item_id}, {"$set": update_data})
    updated_item = await db.lost_found.find_one({"id": item_id}, {"_id": 0})
    return LostFoundResponse(**updated_item)

api_router.include_router(lostfound_router)

# ============= ANALYTICS ROUTES =============
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

@analytics_router.get("/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(require_role(["management"]))):
    # Only count public issues for analytics
    total_issues = await db.issues.count_documents({"visibility": "Public"})
    open_issues = await db.issues.count_documents({
        "visibility": "Public",
        "status": {"$in": ["Reported", "Assigned", "In Progress"]}
    })
    resolved_issues = await db.issues.count_documents({
        "visibility": "Public",
        "status": "Resolved"
    })
    
    # Issues by category
    pipeline = [
        {"$match": {"visibility": "Public"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_category = await db.issues.aggregate(pipeline).to_list(10)
    
    # Issues by priority
    pipeline = [
        {"$match": {"visibility": "Public"}},
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]
    by_priority = await db.issues.aggregate(pipeline).to_list(10)
    
    # Issues by hostel/block
    pipeline = [
        {"$match": {"visibility": "Public"}},
        {"$group": {
            "_id": {
                "hostel": "$location.hostel",
                "block": "$location.block"
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    by_hostel_block = await db.issues.aggregate(pipeline).to_list(20)
    
    # Calculate average response and resolution times (for public issues only)
    pipeline = [
        {"$match": {"visibility": "Public", "status_history": {"$exists": True, "$ne": []}}},
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "avg_response_time": {"$avg": {
                "$subtract": [
                    {"$toDate": {"$arrayElemAt": ["$status_history.timestamp", 1]}},
                    {"$toDate": {"$arrayElemAt": ["$status_history.timestamp", 0]}}
                ]
            }},
            "avg_resolution_time": {"$avg": {
                "$cond": [
                    {"$eq": [{"$arrayElemAt": ["$status_history.new_status", -1]}, "Resolved"]},
                    {
                        "$subtract": [
                            {"$toDate": {"$arrayElemAt": ["$status_history.timestamp", -1]}},
                            {"$toDate": {"$arrayElemAt": ["$status_history.timestamp", 0]}}
                        ]
                    },
                    None
                ]
            }}
        }}
    ]
    time_stats = await db.issues.aggregate(pipeline).to_list(1)
    avg_response_hours = (time_stats[0]["avg_response_time"] / (1000 * 3600)) if time_stats and time_stats[0].get("avg_response_time") else 0
    avg_resolution_hours = (time_stats[0]["avg_resolution_time"] / (1000 * 3600)) if time_stats and time_stats[0].get("avg_resolution_time") else 0
    
    return {
        "total_issues": total_issues,
        "open_issues": open_issues,
        "resolved_issues": resolved_issues,
        "resolution_rate": round((resolved_issues / total_issues * 100) if total_issues > 0 else 0, 2),
        "by_category": by_category,
        "by_priority": by_priority,
        "by_hostel_block": by_hostel_block,
        "avg_response_time_hours": round(avg_response_hours, 2),
        "avg_resolution_time_hours": round(avg_resolution_hours, 2)
    }

# ============= ISSUE DUPLICATE MANAGEMENT =============
@issue_router.post("/{issue_id}/merge/{duplicate_issue_id}")
async def merge_duplicate_issues(
    issue_id: str,
    duplicate_issue_id: str,
    current_user: dict = Depends(require_role(["management"]))
):
    """Merge a duplicate issue into the main issue, preserving all reporters"""
    main_issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    duplicate_issue = await db.issues.find_one({"id": duplicate_issue_id}, {"_id": 0})
    
    if not main_issue or not duplicate_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Track the merge
    merge_record = {
        "merged_at": datetime.now(timezone.utc).isoformat(),
        "merged_by": current_user["id"],
        "merged_by_name": current_user["name"],
        "duplicate_issue_id": duplicate_issue_id,
        "duplicate_reporter_id": duplicate_issue["reporter_id"],
        "duplicate_reporter_name": duplicate_issue["reporter_name"]
    }
    
    # Update main issue to mark duplicates
    await db.issues.update_one(
        {"id": issue_id},
        {
            "$push": {
                "merged_issues": duplicate_issue_id,
                "status_history": {
                    "old_status": main_issue["status"],
                    "new_status": main_issue["status"],
                    "updated_by": current_user["id"],
                    "updated_by_name": current_user["name"],
                    "remarks": f"Merged duplicate issue {duplicate_issue_id}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            },
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Mark duplicate as merged
    await db.issues.update_one(
        {"id": duplicate_issue_id},
        {
            "$set": {
                "is_duplicate": True,
                "merged_with": issue_id,
                "status": "Closed",
                "closed_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {
                "status_history": {
                    "old_status": duplicate_issue["status"],
                    "new_status": "Closed",
                    "updated_by": current_user["id"],
                    "updated_by_name": current_user["name"],
                    "remarks": f"Merged into issue {issue_id}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    
    updated_main = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    return IssueResponse(**updated_main)

api_router.include_router(analytics_router)

# Include API router
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.get("/health")
async def health_check():
    try:
        # Check DB connection
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected", "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
