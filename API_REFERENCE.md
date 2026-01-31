# Hostel Management System - Complete API Reference

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints except `/auth/register` and `/auth/login` require:
```
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
```

---

## 🔐 Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

Request:
{
  "name": "John Student",
  "email": "john@college.edu",
  "phone": "9876543210",
  "password": "SecurePassword123",
  "role": "student",
  "hostel": "Hostel-A",
  "block": "Block-1",
  "room": "101",
  "profile_image": "https://...",
  "expertise": ["Plumbing"],           // For management only
  "assigned_areas": [                 // For management only
    {
      "hostel": "Hostel-A",
      "blocks": ["Block-1", "Block-2"]
    }
  ]
}

Response: 201 Created
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {...}
}
```

### Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "john@college.edu",
  "password": "SecurePassword123"
}

Response: 200 OK
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "name": "John Student",
    "email": "john@college.edu",
    "role": "student",
    "hostel": "Hostel-A",
    "block": "Block-1",
    "room": "101"
  }
}
```

---

## 📋 Issue Management Endpoints

### Create Issue
```
POST /issues/
Authorization: Bearer {token}

Request:
{
  "title": "Plumbing issue in bathroom",
  "description": "Water leaking from tap fixture. Started this morning.",
  "category": "Plumbing",
  "priority": "High",
  "visibility": "Public"
}

Response: 201 Created
{
  "id": "issue-uuid",
  "ticket_id": "HOS-2024-001",
  "reporter_id": "user-uuid",
  "reporter_name": "John Student",
  "reporter_email": "john@college.edu",
  "category": "Plumbing",
  "priority": "High",
  "title": "Plumbing issue in bathroom",
  "description": "Water leaking from tap fixture...",
  "status": "Reported",
  "visibility": "Public",
  "location": {
    "hostel": "Hostel-A",
    "block": "Block-1",
    "room": "101"
  },
  "media": [],
  "assigned_to": null,
  "assigned_to_name": null,
  "ai_predictions": {
    "category": "Plumbing",
    "priority": "High",
    "confidence_score": 0.95,
    "estimated_resolution_hours": 2.5
  },
  "status_history": [
    {
      "old_status": null,
      "new_status": "Reported",
      "updated_by": "user-uuid",
      "updated_by_name": "John Student",
      "remarks": "Issue reported",
      "timestamp": "2024-01-31T10:30:00Z"
    }
  ],
  "comments": [],
  "views": 0,
  "upvotes": [],
  "created_at": "2024-01-31T10:30:00Z",
  "updated_at": "2024-01-31T10:30:00Z"
}
```

### Get All Issues (Role-Filtered)
```
GET /issues/?status=Reported&category=Plumbing&priority=High&limit=20&page=1
Authorization: Bearer {token}

Query Parameters:
  - status: Optional (Reported, Assigned, In Progress, Resolved, Closed)
  - category: Optional (Plumbing, Electrical, etc.)
  - priority: Optional (Low, Medium, High, Emergency)
  - page: Optional (default: 1)
  - limit: Optional (default: 20, max: 100)

Response: 200 OK
[
  {...issue1...},
  {...issue2...}
]
```

### Get Issue Details
```
GET /issues/{issue_id}
Authorization: Bearer {token}

Response: 200 OK
{...complete issue object...}
```

### Update Issue Status (Management Only)
```
PATCH /issues/{issue_id}/status
Authorization: Bearer {token}

Request:
{
  "status": "In Progress",
  "assigned_to": "maintenance-user-id",
  "priority": "High",
  "remarks": "Started work on the plumbing issue"
}

Response: 200 OK
{...updated issue object...}
```

### Add Comment
```
POST /issues/{issue_id}/comments
Authorization: Bearer {token}

Request:
{
  "text": "This issue has been reported in Block-2 as well",
  "parent_comment": null  // Optional, for threaded replies
}

Response: 201 Created
{
  "id": "comment-uuid",
  "user_id": "user-uuid",
  "user_name": "John Student",
  "user_role": "student",
  "text": "This issue has been reported in Block-2 as well",
  "parent_comment": null,
  "created_at": "2024-01-31T10:35:00Z"
}
```

### Upvote/Reaction
```
POST /issues/{issue_id}/upvote
Authorization: Bearer {token}

Request: {} (empty body)

Response: 200 OK
{
  "upvote_count": 5,
  "has_upvoted": true
}
```

### Upload Media
```
POST /issues/{issue_id}/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
  - file: (binary image/video file)

Response: 201 Created
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "cloudinary-id",
  "file_type": "image/jpeg",
  "uploaded_at": "2024-01-31T10:35:00Z"
}
```

### Search Issues
```
GET /issues/search?query=plumbing&category=Plumbing&status=Open
Authorization: Bearer {token}

Query Parameters:
  - query: Optional (searches title, description, ticket_id)
  - category: Optional
  - priority: Optional
  - status: Optional
  - visibility: Optional

Response: 200 OK
[...matching issues...]
```

### Merge Duplicate Issues (Management Only)
```
POST /issues/{main_issue_id}/merge/{duplicate_issue_id}
Authorization: Bearer {token}

Response: 200 OK
{...main issue with duplicate marked as closed...}
```

### Get Hostel Analytics
```
GET /issues/analytics/by-hostel/{hostel_name}
Authorization: Bearer {token}

Response: 200 OK
{
  "hostel": "Hostel-A",
  "data": [
    {
      "_id": {
        "block": "Block-1",
        "status": "Reported"
      },
      "count": 3
    }
  ]
}
```

---

## 📢 Announcements Endpoints

### Create Announcement (Management Only)
```
POST /announcements/
Authorization: Bearer {token}

Request:
{
  "title": "Water Pipeline Maintenance",
  "description": "Water supply will be unavailable in Block-1 and Block-2 from 2 AM to 6 AM on Feb 1st",
  "priority": "Important",
  "category": "Maintenance",
  "target_audience": {
    "roles": ["student", "management"],
    "hostels": ["Hostel-A"],
    "blocks": [
      {
        "hostel": "Hostel-A",
        "block": "Block-1"
      },
      {
        "hostel": "Hostel-A",
        "block": "Block-2"
      }
    ]
  },
  "is_pinned": true,
  "expires_at": "2024-02-02T00:00:00Z"
}

Response: 201 Created
{...announcement object...}
```

### Get Announcements (Role and Location Filtered)
```
GET /announcements/
Authorization: Bearer {token}

Response: 200 OK
[
  {...announcement1...},
  {...announcement2...}
]
```

---

## 📌 Notifications Endpoints

### Get Notifications
```
GET /notifications/?unread_only=false
Authorization: Bearer {token}

Query Parameters:
  - unread_only: Optional (default: false)

Response: 200 OK
[
  {
    "id": "notification-uuid",
    "recipient": "user-uuid",
    "type": "NEW_ISSUE",
    "title": "New Issue Reported",
    "message": "Plumbing issue reported in Hostel-A",
    "related_issue": "issue-uuid",
    "link": "/issues/issue-uuid",
    "is_read": false,
    "priority": "High",
    "created_at": "2024-01-31T10:30:00Z"
  }
]
```

### Mark Notification as Read
```
PATCH /notifications/{notification_id}/read
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true
}
```

---

## 🔍 Lost & Found Endpoints

### Create Lost/Found Item
```
POST /lost-found/
Authorization: Bearer {token}

Request:
{
  "type": "lost",
  "item_name": "Black Backpack",
  "description": "Black Jansport backpack with laptop inside. Has initials 'JS' on front.",
  "category": "Accessories",
  "location": {
    "hostel": "Hostel-A",
    "block": "Block-1",
    "specific_place": "Library Study Area"
  },
  "last_seen_date": "2024-01-30T18:00:00Z",
  "contact_info": {
    "phone": "9876543210",
    "email": "john@college.edu",
    "preferred_contact": "email"
  }
}

Response: 201 Created
{...item object...}
```

### Get Lost & Found Items
```
GET /lost-found/?type=lost&category=Accessories
Authorization: Bearer {token}

Query Parameters:
  - type: Optional (lost, found)
  - category: Optional (Electronics, Documents, Clothing, etc.)

Response: 200 OK
[...items...]
```

### Claim Item
```
POST /lost-found/{item_id}/claim
Authorization: Bearer {token}

Request: {}

Response: 200 OK
{...updated item with claimant info...}
```

### Verify Claim (Management Only)
```
PATCH /lost-found/{item_id}/verify
Authorization: Bearer {token}

Request:
{
  "verified": true
}

Response: 200 OK
{...verified item...}
```

---

## 📊 Analytics Endpoints

### Get Dashboard Analytics (Management Only)
```
GET /analytics/dashboard
Authorization: Bearer {token}

Response: 200 OK
{
  "total_issues": 45,
  "open_issues": 12,
  "resolved_issues": 28,
  "resolution_rate": 62.22,
  "avg_response_time_hours": 4.5,
  "avg_resolution_time_hours": 24.3,
  "by_category": [
    {
      "_id": "Plumbing",
      "count": 15
    },
    {
      "_id": "Electrical",
      "count": 12
    }
  ],
  "by_priority": [
    {
      "_id": "High",
      "count": 8
    },
    {
      "_id": "Medium",
      "count": 20
    }
  ],
  "by_hostel_block": [
    {
      "_id": {
        "hostel": "Hostel-A",
        "block": "Block-1"
      },
      "count": 10
    }
  ]
}
```

---

## 🤖 AI Assistant Endpoint

### Chat with AI
```
POST /ai/chat
Authorization: Bearer {token}

Request:
{
  "message": "How do I report a plumbing issue?",
  "session_id": "optional-session-uuid"
}

Response: 200 OK
{
  "session_id": "session-uuid",
  "response": "To report a plumbing issue, click on 'Create Issue' in your dashboard. Select 'Plumbing' as the category, set the priority level, describe the issue in detail..."
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "detail": "Not authorized" / "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Issue not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting & Best Practices

- Keep requests under 100 per minute per user
- Use pagination for large result sets (limit ≤ 100)
- Cache frequently accessed data client-side
- Use appropriate visibility levels for privacy
- Always include proper error handling

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Server Error - Internal error |

---

## Version
API Version: 1.0
Last Updated: 2024-01-31
