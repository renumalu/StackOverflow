import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv

load_dotenv()

async def seed_data():
    mongo_url = os.getenv('MONGO_URL')
    if not mongo_url:
        print("MONGO_URL not found in environment variables")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[os.getenv('DB_NAME', 'hostel_db')]

    print("Seeding Mess Menu...")
    # Clear existing menu
    await db.mess_menu.delete_many({})
    
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    meal_types = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']
    
    menu_items = {
        'Breakfast': ['Idli Sambar', 'Dosa', 'Poha', 'Bread Omelette', 'Paratha', 'Pongal', 'Poori'],
        'Lunch': ['Rice, Sambar, Veg Fry', 'Roti, Dal, Paneer', 'Fried Rice, Manchurian', 'Rice, Fish Curry', 'Biryani', 'Rice, Rasam', 'Full Meals'],
        'Snacks': ['Samosa', 'Bajji', 'Biscuits', 'Cake', 'Puffs', 'Vada', 'Corn'],
        'Dinner': ['Chapati, Kurma', 'Rice, Egg Curry', 'Noodles', 'Pasta', 'Uthappam', 'Idiyappam', 'Roti, Chicken']
    }

    for i, day in enumerate(days):
        for meal in meal_types:
            item_index = i % len(menu_items[meal])
            items = [menu_items[meal][item_index], 'Tea/Coffee' if meal == 'Breakfast' or meal == 'Snacks' else 'Curd']
            
            await db.mess_menu.insert_one({
                "id": str(uuid.uuid4()),
                "day": day,
                "meal_type": meal,
                "items": items,
                "special_items": ["Sweet"] if meal == 'Lunch' and day == 'Sunday' else [],
                "votes_up": 0,
                "votes_down": 0,
                "voters": {},
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
    print("Mess Menu Seeded!")

    print("Seeding Laundry Machines...")
    # Clear existing laundry
    await db.laundry.delete_many({})
    
    blocks = ['A', 'B', 'C', 'D']
    floors = [1, 2, 3]
    
    for block in blocks:
        for floor in floors:
            for num in range(1, 3): # 2 machines per floor
                await db.laundry.insert_one({
                    "id": str(uuid.uuid4()),
                    "block": block,
                    "floor": floor,
                    "machine_number": f"{block}{floor}0{num}",
                    "type": "Washing Machine",
                    "status": "Available",
                    "current_user_id": None,
                    "current_user_name": None,
                    "start_time": None,
                    "end_time": None,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                })
                
                await db.laundry.insert_one({
                    "id": str(uuid.uuid4()),
                    "block": block,
                    "floor": floor,
                    "machine_number": f"{block}{floor}D{num}",
                    "type": "Dryer",
                    "status": "Available",
                    "current_user_id": None,
                    "current_user_name": None,
                    "start_time": None,
                    "end_time": None,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                })
    print("Laundry Machines Seeded!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
