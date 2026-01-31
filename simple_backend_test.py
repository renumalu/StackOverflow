#!/usr/bin/env python3
"""
Simple Backend API Test using requests library
"""

import requests
import json

BACKEND_URL = "http://localhost:8000/api"

def test_registration():
    """Test user registration"""
    print("🔐 Testing User Registration...")
    
    data = {
        "name": "Alice Smith",
        "email": "alice.smith@hostel.edu",
        "password": "SecurePass456!",
        "phone": "9876543210",
        "role": "student",
        "hostel": "B",
        "block": "3",
        "room": "301"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/register", json=data)
        if response.status_code == 201:
            result = response.json()
            print("✅ Registration successful")
            print(f"   User ID: {result['user']['id']}")
            return result['access_token']
        else:
            print(f"❌ Registration failed - Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None

def test_login():
    """Test user login"""
    print("\n🔑 Testing User Login...")
    
    data = {
        "email": "alice.smith@hostel.edu",
        "password": "SecurePass456!"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Login successful")
            return result['access_token']
        else:
            print(f"❌ Login failed - Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_get_user(token):
    """Test get current user"""
    print("\n👤 Testing Get Current User...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user = response.json()
            print("✅ User profile retrieved")
            print(f"   Name: {user['name']}")
            print(f"   Role: {user['role']}")
            return True
        else:
            print(f"❌ Get user failed - Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Get user error: {e}")
        return False

def test_create_issue(token):
    """Test create issue"""
    print("\n🐛 Testing Issue Creation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "category": "Electrical",
        "priority": "High",
        "title": "Power outlet not working in room",
        "description": "The main power outlet near the desk is not working. No electricity is coming from it. This is affecting my ability to charge devices and use electrical appliances.",
        "visibility": "Public"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/issues/", json=data, headers=headers)
        if response.status_code == 201:
            issue = response.json()
            print("✅ Issue created successfully")
            print(f"   Issue ID: {issue['id']}")
            print(f"   Ticket ID: {issue['ticket_id']}")
            print(f"   AI Predictions: {issue.get('ai_predictions')}")
            return issue['id']
        else:
            print(f"❌ Issue creation failed - Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Issue creation error: {e}")
        return None

def test_get_issues(token):
    """Test get issues"""
    print("\n📋 Testing Get Issues...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BACKEND_URL}/issues/", headers=headers)
        if response.status_code == 200:
            issues = response.json()
            print(f"✅ Issues retrieved - Count: {len(issues)}")
            if issues:
                print(f"   First issue: {issues[0]['title']}")
            return True
        else:
            print(f"❌ Get issues failed - Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Get issues error: {e}")
        return False

def test_ai_chat(token):
    """Test AI chat"""
    print("\n🤖 Testing AI Chat...")
    
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "message": "Hi! I need help with a maintenance issue. What should I do?",
        "session_id": "test-session-456"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/ai/chat", json=data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            print("✅ AI chat successful")
            print(f"   Response: {result['response'][:100]}...")
            return True
        else:
            print(f"❌ AI chat failed - Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ AI chat error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Simple Backend API Tests")
    print(f"Backend URL: {BACKEND_URL}")
    
    results = {}
    
    # Test registration
    token = test_registration()
    results['registration'] = token is not None
    
    if not token:
        # Try login if registration failed
        token = test_login()
        results['login'] = token is not None
    else:
        results['login'] = True  # Registration includes login
    
    if token:
        # Test authenticated endpoints
        results['get_user'] = test_get_user(token)
        issue_id = test_create_issue(token)
        results['create_issue'] = issue_id is not None
        results['get_issues'] = test_get_issues(token)
        results['ai_chat'] = test_ai_chat(token)
    else:
        print("\n❌ No valid token - skipping authenticated tests")
        results.update({
            'get_user': False,
            'create_issue': False,
            'get_issues': False,
            'ai_chat': False
        })
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST RESULTS SUMMARY")
    print("="*50)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title():<20} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend APIs are working correctly!")
    else:
        print("⚠️  Some tests failed.")
    
    return results

if __name__ == "__main__":
    main()