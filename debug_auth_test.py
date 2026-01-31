#!/usr/bin/env python3
"""
Debug authentication issue
"""

import asyncio
import aiohttp
import json

BACKEND_URL = "https://issue-tracker-201.preview.emergentagent.com/api"

async def debug_auth():
    async with aiohttp.ClientSession() as session:
        # Register a user
        print("1. Registering user...")
        register_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "TestPass123!",
            "phone": "1234567890",
            "role": "student",
            "hostel": "A",
            "block": "1",
            "room": "101"
        }
        
        async with session.post(f"{BACKEND_URL}/auth/register", json=register_data) as response:
            register_result = await response.json()
            print(f"Register status: {response.status}")
            print(f"Register response: {register_result}")
            
            if response.status == 201:
                token = register_result.get("access_token")
                print(f"Token: {token[:50]}...")
                
                # Test authenticated request
                print("\n2. Testing authenticated request...")
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                # Try /auth/me first
                async with session.get(f"{BACKEND_URL}/auth/me", headers=headers) as auth_response:
                    auth_result = await auth_response.text()
                    print(f"Auth/me status: {auth_response.status}")
                    print(f"Auth/me response: {auth_result}")
                
                # Try issues endpoint
                async with session.get(f"{BACKEND_URL}/issues", headers=headers) as issues_response:
                    issues_result = await issues_response.text()
                    print(f"Issues status: {issues_response.status}")
                    print(f"Issues response: {issues_result}")

if __name__ == "__main__":
    asyncio.run(debug_auth())