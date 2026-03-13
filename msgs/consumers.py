import json
from channels.generic.websocket import AsyncWebsocketConsumer

class MessageCountConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Only allow admins
        if not (self.scope["user"].is_authenticated and self.scope["user"].is_superuser):
            await self.close()
            return
        
        await self.channel_layer.group_add("admins", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("admins", self.channel_name)

    # Receive broadcast from ws.py
    async def unread_update(self, event):
        await self.send(text_data=json.dumps({
            "unread": event["unread"]
        }))
