from datetime import datetime

def generate_ticket_id() -> str:
    now = datetime.utcnow()
    date_str = now.strftime("%y%m%d")
    time_str = now.strftime("%H%M%S")
    return f"HST-{date_str}-{time_str}"
