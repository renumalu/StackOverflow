import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
import json
from google import genai
from google.genai import types

load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Failed to initialize Gemini client: {e}")

    async def get_chat_response(self, session_id: str, user_message: str, user_context: dict, message_history: List[Dict] = None) -> str:
        """AI chat response using Gemini with fallback"""
        if self.client:
            try:
                system_prompt = f"""You are a helpful Hostel AI Assistant.
Current User: {user_context.get('name')} ({user_context.get('role')})
Hostel: {user_context.get('hostel')}

Capabilities:
- Help with reporting issues (Maintenance, Electrical, etc.)
- Guide on Mess Menu and Voting
- Explain Gate Pass procedures
- Provide info on Laundry and Marketplace

Keep answers concise and helpful. If unsure, suggest contacting the warden.

User Question: {user_message}"""

                response = self.client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=system_prompt
                )
                return response.text
            except Exception as e:
                print(f"AI API Error: {str(e)}")
                # Fallback to keyword matching
                pass

        # Fallback Logic
        return self._keyword_response(user_message)

    def _keyword_response(self, user_message: str) -> str:
        lower_msg = user_message.lower()
        
        # Greetings & General
        if any(w in lower_msg for w in ['hi', 'hello', 'hey', 'greetings']):
            return "Hello! I am your Hostel Assistant. I can help you with Issues, Mess Menu, Gate Passes, and more. What do you need?"
        elif 'who are you' in lower_msg or 'what can you do' in lower_msg:
            return "I am an AI-powered assistant designed to manage hostel activities. I can help you report issues, check the food menu, apply for gate passes, and find lost items."
        elif 'thank' in lower_msg:
            return "You're welcome! Let me know if you need anything else."

        # Issues & Maintenance
        elif 'issue' in lower_msg or 'problem' in lower_msg or 'complaint' in lower_msg:
            return "To report an issue, go to the 'Create Issue' section. You can report Plumbing, Electrical, or Furniture problems and track their status."
        elif 'water' in lower_msg or 'leak' in lower_msg:
            return "For water or plumbing issues, please report it immediately under the 'Plumbing' category in the Issues tab so maintenance can fix it."
        elif 'internet' in lower_msg or 'wifi' in lower_msg:
            return "If Wi-Fi is down, try restarting your device first. If it persists, report it under 'Internet' issues. The common hostel Wi-Fi password is usually 'Hostel@123' (check with warden)."
        
        # Emergency
        elif 'emergency' in lower_msg or 'urgent' in lower_msg or 'fire' in lower_msg:
            return "🚨 FOR EMERGENCIES: Please mark your issue as 'Emergency' priority immediately. You should also call the Warden or Security directly."
        
        # Mess & Food
        elif 'mess' in lower_msg or 'food' in lower_msg or 'menu' in lower_msg or 'dinner' in lower_msg or 'lunch' in lower_msg:
            return "You can view the daily breakfast, lunch, and dinner menu in the 'Mess' section. Don't forget to vote for your favorite dishes!"
        
        # Lost & Found
        elif 'lost' in lower_msg or 'found' in lower_msg or 'wallet' in lower_msg or 'key' in lower_msg:
            return "Lost something? Check the 'Lost & Found' section. If you found an item, please list it there to help its owner find it."
        
        # Gate Pass & Outing
        elif 'gate' in lower_msg or 'pass' in lower_msg or 'leave' in lower_msg or 'outing' in lower_msg:
            return "Need to go out? Apply for a 'Gate Pass' in the app. Once approved by the warden, you can show the digital pass at the security gate."
        
        # Laundry
        elif 'laundry' in lower_msg or 'wash' in lower_msg or 'cloth' in lower_msg:
            return "You can check the availability of washing machines in the 'Laundry' section and book a slot to avoid waiting."
        
        # Contact & Rules
        elif 'warden' in lower_msg or 'contact' in lower_msg or 'number' in lower_msg:
            return "You can find contact details for the Warden and Security in the 'Dashboard' or notice board. For app support, contact the admin."
        elif 'rule' in lower_msg or 'timing' in lower_msg:
            return "Hostel gates close at 10:00 PM. Silence hours start at 11:00 PM. Please maintain cleanliness and discipline."
        
        # Marketplace
        elif 'buy' in lower_msg or 'sell' in lower_msg or 'market' in lower_msg:
            return "Visit the 'Marketplace' to buy or sell used books, electronics, and furniture within the hostel community."

        else:
            return "I can help with Issues, Mess, Gate Pass, Laundry, and Marketplace. Could you please rephrase your question?"

    async def predict_issue_category(self, title: str, description: str) -> dict:
        """Predict category using AI with fallback"""
        if self.client:
            try:
                prompt = f"""Analyze this hostel issue and categorize it.
Title: {title}
Description: {description}

Respond in JSON format with:
- category: One of [Plumbing, Electrical, Cleanliness, Internet, Furniture, Security, Others]
- priority: One of [Low, Medium, High, Emergency]
- confidence: Float 0.0-1.0
- estimated_hours: Int (hours to fix)
"""
                response = self.client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=prompt
                )
                # Clean markdown if present
                text = response.text.replace('```json', '').replace('```', '')
                return json.loads(text)
            except Exception as e:
                print(f"AI Prediction Error: {str(e)}")
                # Fallback
                pass

        # Fallback Logic
        combined_text = (title + " " + description).lower()
        
        if any(word in combined_text for word in ['water', 'pipe', 'leak', 'drainage', 'tap', 'shower']):
            category = "Plumbing"
            priority = "High"
        elif any(word in combined_text for word in ['light', 'electric', 'fan', 'plug', 'switch', 'power']):
            category = "Electrical"
            priority = "High"
        elif any(word in combined_text for word in ['dirty', 'clean', 'garbage', 'trash', 'dust']):
            category = "Cleanliness"
            priority = "Medium"
        elif any(word in combined_text for word in ['internet', 'wifi', 'network', 'connection']):
            category = "Internet"
            priority = "Medium"
        elif any(word in combined_text for word in ['bed', 'chair', 'table', 'door', 'window', 'furniture']):
            category = "Furniture"
            priority = "Low"
        elif any(word in combined_text for word in ['security', 'theft', 'lock', 'break-in']):
            category = "Security"
            priority = "High"
        else:
            category = "Others"
            priority = "Medium"
        
        return {
            "category": category,
            "priority": priority,
            "confidence": 0.7,
            "estimated_hours": 24
        }

ai_service = AIService()
