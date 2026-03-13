from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import hashlib

def safe_group(email):
    return "user_" + hashlib.sha256(email.lower().encode()).hexdigest()[:32]

def push_message(message):
    channel = get_channel_layer()
    group = safe_group("admin@system")   # All messages go to admins
    # -> If multiple admins exist, we could instead loop & send to each user's safe_group

    async_to_sync(channel.group_send)(
        group,
        {
            "type": "message_event",
            "data": {
                "id": str(message.id),
                "sender": message.sender,
                "subject": message.subject,
                "timestamp": message.timestamp.isoformat(),
                "has_attachments": message.attachments.exists(),
                "read": message.read,
            }
        }
    )
