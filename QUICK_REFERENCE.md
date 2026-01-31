# Hostel Management System - Quick Reference Guide

## 🚀 Quick Start

### Run Backend Server
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --reload
```
API runs on: `http://localhost:8000`

### Run Frontend
```bash
cd frontend
npm install
npm start
```
App runs on: `http://localhost:3000`

---

## 👥 User Roles & Capabilities

### Student
```
✓ Report issues
✓ View own issues
✓ View public hostel issues
✓ Add comments to public issues
✓ Upvote issues
✓ Report lost/found items
✓ Claim found items
✓ View announcements
```

### Management
```
✓ View all issues (public & private)
✓ Assign issues to teams
✓ Update issue status
✓ Add remarks to issues
✓ Create announcements
✓ View analytics dashboard
✓ Verify lost/found claims
✓ Merge duplicate issues
```

---

## 📋 Issue Categories

- Plumbing
- Electrical
- Cleanliness
- Internet
- Furniture
- Security
- Others

---

## ⚡ Issue Priority Levels

1. **Low** - Non-urgent maintenance
2. **Medium** - Standard maintenance
3. **High** - Urgent issues
4. **Emergency** - Critical problems

---

## 🔄 Issue Lifecycle

```
Reported → Assigned → In Progress → Resolved → Closed
    ↓        ↓           ↓            ↓         ↓
  Created  Staff     Working on   Fixed     Done
           assigned   the issue
```

---

## 📢 Announcements

**Types**: Maintenance, Schedule, Alert, General, Event

**Targeting**:
- By Role: Student, Management
- By Location: Hostel, Block
- By Combination: Role + Location

**Features**:
- Pin for priority
- Expiry date support
- Read status tracking

---

## 📍 Lost & Found Status Flow

```
Open → Matched → Claimed → Returned/Closed
 ↓       ↓         ↓           ↓
Item    Item    Claimed    Verified by
posted  matched by user    management
```

---

## 📊 Dashboard Metrics (Management Only)

- Total issues (public only)
- Open issues count
- Resolved issues count
- Resolution rate %
- Average response time
- Average resolution time
- Issues by category
- Issues by priority
- Hostel/block density

---

## 💬 Community Features

### Comments
- Add on any public issue
- Threaded replies supported
- Show user role
- Auto-timestamp

### Upvotes
- Mark issue as helpful
- View count shows support
- Community validation
- Track views

---

## 🔀 Duplicate Management

**Merge Process**:
1. Identify duplicate issues
2. Select main issue
3. Merge duplicate into main
4. All reporters preserved
5. Comments maintained
6. History recorded

---

## 🛡️ Security Features

- JWT Authentication
- Role-Based Access Control
- Bcrypt Password Hashing
- Token Expiry Validation
- CORS Protection
- Data Encryption Ready

---

## 🔗 Key API Endpoints

```
# Authentication
POST   /auth/register
POST   /auth/login

# Issues
POST   /issues/
GET    /issues/
GET    /issues/{id}
PATCH  /issues/{id}/status
POST   /issues/{id}/comments
POST   /issues/{id}/upvote
POST   /issues/{id}/merge/{duplicate}

# Announcements
POST   /announcements/
GET    /announcements/

# Lost & Found
POST   /lost-found/
GET    /lost-found/
POST   /lost-found/{id}/claim
PATCH  /lost-found/{id}/verify

# Analytics
GET    /analytics/dashboard

# Notifications
GET    /notifications/
PATCH  /notifications/{id}/read
```

---

## 📱 Common Tasks

### Report an Issue
1. Click "Create Issue" (Student Dashboard)
2. Fill title and description
3. Select category and priority
4. Choose visibility (Public/Private)
5. Click "Submit Issue"
6. See success message

### View Issue Status
1. Click "My Issues" (Student Dashboard)
2. Select issue to view
3. See status history
4. Read comments
5. Click upvote if helpful

### Update Issue Status (Management)
1. Open Management Dashboard
2. Find issue in list
3. Use status dropdown
4. Select new status
5. Add remarks if needed
6. Click update

### Create Announcement (Management)
1. Click "New Announcement"
2. Enter title and description
3. Set priority and category
4. Select target audience:
   - Role (Student/Management)
   - Hostel
   - Block (optional)
5. Set expiry date (optional)
6. Pin if important
7. Publish

### Search Issues
1. Use search bar with query
2. Filter by category
3. Filter by priority
4. Filter by status
5. View results

---

## 🚨 Error Handling

| Error | Meaning | Solution |
|-------|---------|----------|
| 401 | Unauthorized | Login required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 400 | Bad Request | Check input validation |
| 500 | Server Error | Contact support |

---

## 🔍 Important Notes

1. **Public Issues Only in Analytics**
   - Private issues excluded from dashboard
   - Management sees all issues but analytics show public only

2. **Student Location Required**
   - Hostel, block, room mandatory for students
   - Auto-tagged in all issues

3. **Role-Based Filtering**
   - Students see own + public hostel issues
   - Management sees all issues

4. **Announcement Targeting**
   - Empty role/hostel = applies to all
   - Can target by role + location combination

5. **Lost & Found Verification**
   - Students claim items
   - Management verifies
   - Item status auto-updates

6. **Duplicate Merging**
   - Main issue preserved
   - Duplicate closed automatically
   - All reporters retained

---

## 📞 Support

### Documentation
- Full API Reference: `API_REFERENCE.md`
- Features Guide: `FEATURES_IMPLEMENTATION.md`
- Implementation Details: `IMPLEMENTATION_SUMMARY.md`

### Troubleshooting
1. Check API logs: `python -m uvicorn server:app --reload --log-level debug`
2. Verify database connection
3. Check environment variables
4. Review error messages in UI

---

## 📈 Performance Tips

1. Use pagination for large datasets
2. Implement caching for announcements
3. Filter by status before analysis
4. Use search instead of full list load
5. Limit announcement retrieval

---

## 🎓 Example Scenarios

### Scenario 1: Report & Track Issue
```
1. Student reports plumbing issue
2. Issue assigned to maintenance
3. Student sees status "Assigned"
4. Maintenance updates to "In Progress"
5. Issue resolved
6. Student sees "Resolved" status
7. Issue closed
```

### Scenario 2: Lost Item Recovery
```
1. Student reports lost backpack
2. Another student finds it
3. Finder reports found item
4. Student claims the item
5. Management verifies claim
6. Status updates to "Returned"
```

### Scenario 3: Duplicate Merge
```
1. Two students report same plumbing issue
2. Management sees duplicate
3. Merges into main issue
4. Both reporters tracked
5. All comments preserved
6. Single resolution workflow
```

---

## 🎯 Best Practices

1. **Be Descriptive**: Provide detailed issue descriptions
2. **Use Categories**: Select appropriate categories
3. **Set Priority**: Mark urgency correctly
4. **Add Comments**: Help others understand the issue
5. **Upvote Issues**: Show community support
6. **Verify Claims**: Management should verify before closing
7. **Use Announcements**: Keep residents informed
8. **Check Analytics**: Management should monitor metrics

---

## 🔐 Security Reminders

- Never share login credentials
- Use strong passwords (min 6 characters, recommended 12+)
- Change password regularly
- Don't store sensitive data in comments
- Report suspicious activity
- Keep token secure (auto-managed)
- Logout when done

---

## 📅 Maintenance Schedule

- **Daily**: Monitor open issues
- **Weekly**: Review analytics
- **Monthly**: Archive resolved issues
- **Quarterly**: Review and merge duplicates
- **Annually**: System audit

---

**Last Updated**: 2024-01-31

**Version**: 1.0

**Status**: ✅ Ready for Production
