from django.db.models.signals import post_save
from django.dispatch import receiver
from invoices.models import Invoice, Payment
from .models import Notification
from .ws import push_notification

# This signal listens to all Notification creations
@receiver(post_save, sender=Notification)
def send_notification_ws(sender, instance, created, **kwargs):
    if created:
        # Push to connected users via WebSocket
        push_notification(instance)
