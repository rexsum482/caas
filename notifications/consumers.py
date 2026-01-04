import hashlib
import json
from channels.generic.websocket import AsyncWebsocketConsumer

def safe_group(email):
    return "user_" + hashlib.sha256(email.lower().encode()).hexdigest()[:32]


class UserEventConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.email = self.scope["url_route"]["kwargs"]["group"]
        self.group = self.email  # already hashed client-side

        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group, self.channel_name)

    # 🔥 Notifications
    async def notify(self, event):
        await self.send(json.dumps({
            "type": "notification",
            "payload": event["data"]
        }))

    # 🔥 Messages
    async def message_event(self, event):
        await self.send(json.dumps({
            "type": "message",
            "payload": event["data"]
        }))
