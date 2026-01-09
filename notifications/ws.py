from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import hashlib
from .serializers import NotificationSerializer

def safe_group(email):
    return "user_" + hashlib.sha256(email.lower().encode()).hexdigest()[:32]

def push_notification(notification):
    channel = get_channel_layer()
    group = safe_group(notification.invoice.customer.email)

    async_to_sync(channel.group_send)(
        group,
        {
        "type": "notify", 
        "data": NotificationSerializer(notification)
        }
    )
