import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test_emergent_connection():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    print(f"Testing Key: {api_key[:10]}...")
    
    if not api_key:
        print("❌ No API Key found")
        return

    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.emergent.ai/v1"
    )

    try:
        print("⏳ Attempting to connect to Emergent AI...")
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello, are you working?"}],
            max_tokens=10
        )
        print("✅ Success!")
        print(f"Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_emergent_connection())
