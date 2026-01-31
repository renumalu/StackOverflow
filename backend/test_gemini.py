import asyncio
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

async def test_gemini_connection():
    # Try both env vars to be safe
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("EMERGENT_LLM_KEY")
    print(f"Testing Key: {api_key[:10] if api_key else 'None'}...")
    
    if not api_key:
        print("❌ No API Key found")
        return

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        print("⏳ Attempting to connect to Gemini...")
        response = model.generate_content("Hello, are you working?")
        
        print("✅ Success!")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini_connection())
