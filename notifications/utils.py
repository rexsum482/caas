from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from notifications.models import Notification
from users.models import CustomUser

channel_layer = get_channel_layer()

def broadcast_notification(message: str):
    """
    Sends a notification to all users.
    Stores it in DB for later retrieval, and sends via WebSocket if connected.
    """
    users = CustomUser.objects.all()
    for user in users:
        # Create a DB entry for the notification
        notif = Notification.objects.create(
            user=user,
            message=message,
        )

        # Send via WebSocket if connected
        group_name = f"user_{user.id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "notify",
                "data": {
                    "id": notif.id,
                    "message": notif.message,
                    "created_at": notif.created_at.isoformat(),
                },
            },
        )
