import asyncio
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

async def test_gemini_final():
    api_key = os.getenv("AIzaSyBI1hGj8-epbrDeXHKJdsvBloTq-DwiAZM")
    print(f"Testing Gemini Key: {api_key[:10]}...")
    
    if not api_key:
        print("❌ No API Key found")
        return

    try:
        genai.configure(api_key=api_key)
        # Using the model that we know exists
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        print("⏳ Attempting to connect to Gemini 2.0 Flash...")
        response = model.generate_content("Give me a one sentence welcome message for a hostel app.")
        
        print("✅ Success!")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini_final())
