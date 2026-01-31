# Deployment Guide

This guide provides instructions on how to deploy the Hostel Management System.

## Architecture
The application consists of two parts:
1.  **Backend**: FastAPI (Python) with MongoDB
2.  **Frontend**: React (JavaScript)

## Prerequisites
-   Python 3.11+
-   Node.js 18+
-   MongoDB Atlas Account
-   Google Gemini API Key

---

## 1. Backend Deployment

### Environment Variables
Set the following environment variables on your backend hosting provider (e.g., Render, Railway, Heroku):

```env
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DB_NAME=hostel_db
JWT_SECRET=your_super_secret_jwt_key_change_this
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

### Build Command
```bash
pip install -r requirements.txt
```

### Start Command
```bash
uvicorn server:app --host 0.0.0.0 --port 10000
```

---

## 2. Frontend Deployment

### Environment Variables
Set the following environment variables on your frontend hosting provider (e.g., Vercel, Netlify):

```env
REACT_APP_BACKEND_URL=https://your-backend-domain.com
ENABLE_HEALTH_CHECK=false
```

### Build Command
```bash
npm install
npm run build
```

### Output Directory
`build`

---

## 3. Database Seeding (First Time Only)
After deploying the backend, you need to seed the initial data (Mess Menu & Laundry Machines).

You can run the seed script locally by connecting to your remote MongoDB:

1.  Update your local `.env` file with the **Production** `MONGO_URL`.
2.  Run:
    ```bash
    python seed_data.py
    ```

## 4. Verification
1.  Open the frontend URL.
2.  Register a new account (Management/Student).
3.  Check if Mess Menu and Laundry data loads.
4.  Test the AI Chat assistant.
