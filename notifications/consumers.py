import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger("notifications.ws")

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")

        if not user or user.is_anonymous:
            await self.close()
            return

        email = self.scope['url_route']['kwargs']['email']

        self.group_name = f"{email}"  # SAME as push_notification()

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        print(f"🔔 WebSocket joined group => {self.group_name}")


    async def disconnect(self, code):
        logger.info(
            "WS disconnect",
            extra={
                "code": code,
                "group": getattr(self, "group_name", None),
            },
        )

        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

    async def notify(self, event):
        logger.debug(
            "WS notify received",
            extra={
                "group": getattr(self, "group_name", None),
                "payload": event.get("data"),
            },
        )

        await self.send_json(event["data"])
