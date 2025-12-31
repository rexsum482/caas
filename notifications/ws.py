from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .serializers import NotificationSerializer
from .push import send_mobile_push
from .models import Device

def push_notification(notification):
    channel_layer = get_channel_layer()
    serializer = NotificationSerializer(notification)

    async_to_sync(channel_layer.group_send)(
        group=f"{notification.invoice.customer.email}",
        message=
        {
            "type": "notify",
            "data": serializer.data,
        }
    )

    devices = Device.objects.filter(user=notification.user)
    for device in devices:
        send_mobile_push(
            device.token,
            notification.title,
            notification.content,
            {"notification_id": str(notification.id)}
        )
