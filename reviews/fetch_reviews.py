import os
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from reviews.models import GoogleReview
from datetime import datetime

def fetch_google_reviews():
    # Load Environment Variables
    CREDS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH")
    LOCATION_ID = os.getenv("GOOGLE_LOCATION_ID")
    SCOPES = os.getenv("GOOGLE_SCOPES", "https://www.googleapis.com/auth/business.manage").split(",")
    SERVICE_NAME = os.getenv("GOOGLE_API_SERVICE_NAME")
    API_VERSION = os.getenv("GOOGLE_API_VERSION")

    if not LOCATION_ID:
        raise ValueError("GOOGLE_LOCATION_ID is not set in environment variables.")

    # Auth flow using credentials
    flow = InstalledAppFlow.from_client_secrets_file(CREDS_PATH, SCOPES)
    creds = flow.run_local_server(port=0)

    # Business Profile Info service
    reviews_service = build(SERVICE_NAME, API_VERSION, credentials=creds)

    # Fetch reviews
    response = reviews_service.accounts().locations().reviews().list(
        parent=LOCATION_ID
    ).execute()

    # Save to DB
    for r in response.get('reviews', []):
        GoogleReview.objects.update_or_create(
            review_id=r['reviewId'],
            defaults={
                "reviewer_name": r.get('reviewer', {}).get('displayName', ''),
                "rating": int(r['starRating']),
                "comment": r.get('comment', ''),
                "review_time": datetime.fromisoformat(r['createTime'].replace('Z','')),
                "profile_photo_url": r.get('reviewer', {}).get('profilePhotoUrl', '')
            }
        )
    print("Reviews synced successfully!")
