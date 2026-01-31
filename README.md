# Hostel Management System

A comprehensive Hostel Management System designed to streamline daily operations for students and management. This application features a modern React frontend and a robust FastAPI backend with MongoDB.

## 🚀 Key Features

### For Students
- **Dashboard**: Overview of announcements, issues, and activities.
- **Issue Reporting**: Report maintenance issues (plumbing, electrical, etc.) and track their status.
- **Lost & Found**: Report lost items or claim found items.
- **Marketplace**: Buy and sell items within the hostel community.
- **Gate Pass**: Request and manage gate passes (digital approval workflow).
- **Mess Menu**: View daily food menus and vote/rate meals.
- **Laundry**: Check laundry machine availability and book slots.
- **AI Assistant**: Smart chatbot for quick help and queries.

### For Management
- **Dashboard**: Analytics, occupancy stats, and issue tracking.
- **Student Management**: Manage student profiles, room allocations, and verified status.
- **Announcements**: Post important updates and notices.
- **Issue Resolution**: Manage and update status of reported issues.
- **Analytics**: Visual insights into hostel operations.

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI (Python), Motor (Async MongoDB)
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## 📦 Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB (Local or Atlas)

## 🔧 Installation & Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Environment Variables
# Create a .env file in the backend directory with:
MONGODB_URL=mongodb://localhost:27017
DB_NAME=hostel_db
SECRET_KEY=your_secret_key_here
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## 🏃‍♂️ Running the Application

### Start Backend Server
```bash
cd backend
uvicorn server:app --reload --port 8000
```

### Start Frontend Client
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`.

## 🧪 Demo Data & Credentials

The system comes with a data seeding script to populate realistic demo data (Students, Issues, Announcements, etc.).

**Default Admin Credentials:**
- **Email**: `admin@hostel.com`
- **Password**: `admin123`

**Default Student Credentials:**
- You can log in as any seeded student (e.g., `student1@example.com` / `password123` if generated).
- Or register a new student account.

## 📚 Documentation

- [API Reference](API_REFERENCE.md)
- [Deployment Guide](DEPLOY.md)
- [Dark Mode Guide](README_DARK_MODE.md)
