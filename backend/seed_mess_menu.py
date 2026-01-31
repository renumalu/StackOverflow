import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'hostel_db')

async def seed_mess_menu():
    print(f"Connecting to {MONGO_URL} - {DB_NAME}")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Clear existing menu
    await db.mess_menu.delete_many({})
    print("Cleared existing mess menu data")

    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    meal_types = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']
    
    menu_items = {
        'Breakfast': ['Idli Sambar', 'Dosa', 'Poha', 'Bread Omelette', 'Paratha', 'Upma', 'Puri Bhaji'],
        'Lunch': ['Rice & Dal', 'Roti Sabzi', 'Fried Rice', 'Rajma Chawal', 'Curd Rice', 'Veg Biryani', 'Chole Bhature'],
        'Snacks': ['Samosa', 'Tea/Coffee', 'Biscuits', 'Sandwich', 'Pakora', 'Vada Pav', 'Fruit Salad'],
        'Dinner': ['Roti Dal', 'Paneer Butter Masala', 'Egg Curry', 'Chicken Curry', 'Mix Veg', 'Khichdi', 'Pasta']
    }
    
    specials = {
        'Sunday': {'Lunch': ['Chicken Biryani', 'Paneer Tikka'], 'Dinner': ['Ice Cream']},
        'Wednesday': {'Dinner': ['Gulab Jamun']},
        'Friday': {'Lunch': ['Fish Fry', 'Mushroom Curry']}
    }

    count = 0
    for day_idx, day in enumerate(days):
        for meal in meal_types:
            # Rotate items based on day index
            main_item = menu_items[meal][day_idx % len(menu_items[meal])]
            side_item = menu_items[meal][(day_idx + 1) % len(menu_items[meal])]
            
            items = [main_item, side_item]
            if meal == 'Lunch' or meal == 'Dinner':
                items.extend(['Rice', 'Dal', 'Pickle', 'Salad'])
            
            special_items = []
            if day in specials and meal in specials[day]:
                special_items = specials[day][meal]
            
            menu_doc = {
                "id": str(uuid.uuid4()),
                "day": day,
                "meal_type": meal,
                "items": items,
                "special_items": special_items,
                "votes_up": 0,
                "votes_down": 0,
                "voters": {},
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.mess_menu.insert_one(menu_doc)
            count += 1
            
    print(f"Successfully seeded {count} mess menu items")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_mess_menu())
