from django.core.management.base import BaseCommand
from django.utils import timezone
from notifications.models import Notification


class Command(BaseCommand):
    help = "Delete expired notifications"

    def handle(self, *args, **kwargs):
        deleted, _ = Notification.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()
        self.stdout.write(f"Deleted {deleted} expired notifications")
