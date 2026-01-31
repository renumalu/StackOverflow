import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'demo'),
    api_key=os.environ.get('CLOUDINARY_API_KEY', 'demo'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', 'demo')
)

async def upload_file(file_content: bytes, folder: str = "hostel") -> Optional[dict]:
    try:
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="auto"
        )
        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "file_type": result.get("resource_type", "image")
        }
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        return None

async def delete_file(public_id: str) -> bool:
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        print(f"Cloudinary delete error: {str(e)}")
        return False
