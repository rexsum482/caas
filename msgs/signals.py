from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message
from .ws import push_message


@receiver(post_save, sender=Message)
def send_message_ws(sender, instance, created, **kwargs):
    """
    Sends websocket event when a new message is created.
    """
    if created:
        push_message(instance)
