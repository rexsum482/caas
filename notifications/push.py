from firebase_admin import messaging
from django.conf import settings
from .firebase import get_firebase_app, firebase_enabled

def send_mobile_push(token, title, body, data=None):
    # 🚫 Never send push in development
    if not firebase_enabled():
        return

    app = get_firebase_app()
    if not app:
        return

    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=token,
        data=data or {},
    )

    messaging.send(message)
