from fastapi import APIRouter, HTTPException, status, Depends
from models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from utils.jwt_utils import create_access_token
from middleware.auth import get_current_user
import bcrypt
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db():
    from server import db
    return db

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    db = get_db()
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    user_id = str(uuid.uuid4())
    user_dict = user_data.model_dump(exclude={"password"})
    user_dict.update({
        "id": user_id,
        "password": hashed_password.decode('utf-8'),
        "is_active": True,
        "email_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None,
        "login_count": 0
    })
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user_id, "email": user_data.email, "role": user_data.role})
    
    user_response = UserResponse(
        id=user_id,
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        hostel=user_data.hostel,
        block=user_data.block,
        room=user_data.room,
        profile_image=user_data.profile_image,
        is_active=True,
        email_verified=False,
        expertise=user_data.expertise,
        assigned_areas=user_data.assigned_areas,
        shift_timing=user_data.shift_timing,
        created_at=datetime.now(timezone.utc),
        last_login=None
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user["password"].encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "last_login": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$inc": {"login_count": 1}
        }
    )
    
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )
    
    user_response = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        phone=user.get("phone"),
        role=user["role"],
        hostel=user.get("hostel"),
        block=user.get("block"),
        room=user.get("room"),
        profile_image=user.get("profile_image"),
        is_active=user.get("is_active", True),
        email_verified=user.get("email_verified", False),
        expertise=user.get("expertise"),
        assigned_areas=user.get("assigned_areas"),
        shift_timing=user.get("shift_timing"),
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"],
        last_login=datetime.now(timezone.utc)
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        phone=current_user.get("phone"),
        role=current_user["role"],
        hostel=current_user.get("hostel"),
        block=current_user.get("block"),
        room=current_user.get("room"),
        profile_image=current_user.get("profile_image"),
        is_active=current_user.get("is_active", True),
        email_verified=current_user.get("email_verified", False),
        expertise=current_user.get("expertise"),
        assigned_areas=current_user.get("assigned_areas"),
        shift_timing=current_user.get("shift_timing"),
        created_at=datetime.fromisoformat(current_user["created_at"]) if isinstance(current_user["created_at"], str) else current_user["created_at"],
        last_login=datetime.fromisoformat(current_user["last_login"]) if current_user.get("last_login") and isinstance(current_user["last_login"], str) else current_user.get("last_login")
    )
