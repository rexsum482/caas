from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message
from .ws import push_unread_count

@receiver(post_save, sender=Message)
def notify_new_or_read(sender, instance, created, **kwargs):
    push_unread_count()  # fires on new message OR read status change
