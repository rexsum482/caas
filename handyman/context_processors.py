from dotenv import load_dotenv
import os
from django.middleware.csrf import get_token

load_dotenv()

def frontend_context(request):
    return {
        "company_name": os.environ.get("REACT_APP_COMPANY_NAME"),
        "admin_email": os.environ.get("REACT_APP_ADMIN_EMAIL"),
        "primary_color": os.environ.get("REACT_APP_PRIMARY_COLOR"),
        "accent_color": os.environ.get("REACT_APP_ACCENT_COLOR"),
        "csrf_token": get_token(request),
    }
