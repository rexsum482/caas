from firebase_admin import messaging
from django.conf import settings
from .firebase import get_firebase_app, firebase_enabled

def send_mobile_push(token, title, body, data=None):
    if not firebase_enabled():
        return

    app = get_firebase_app()
    if not app:
        return

    message = messaging.MulticastMessage(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data={
            "click_action": "/invoices",
        },
        tokens=token,
    )

    messaging.send(message)
