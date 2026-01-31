import sys
sys.path.insert(0, '.')

try:
    print("Testing imports...")
    from models.user import UserCreate
    print("✓ User model OK")
    from models.issue import IssueCreate
    print("✓ Issue model OK")
    from services.ai_service import ai_service
    print("✓ AI service OK")
    from middleware.auth import get_current_user
    print("✓ Auth middleware OK")
    print("\n✓ All imports successful!")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
