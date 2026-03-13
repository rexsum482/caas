from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = "Broadcast a notification to all users"

    def add_arguments(self, parser):
        parser.add_argument(
            "--message",
            type=str,
            required=True,
            help="Notification message content",
        )
        parser.add_argument(
            "--title",
            type=str,
            default="System Notification",
            help="Notification title",
        )

    def handle(self, *args, **options):
        message = options["message"]
        title = options["title"]

        users = User.objects.all()

        for user in users:
            Notification.objects.create(
                user=user,
                title=title,
                content=message,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Broadcast sent to {users.count()} users"
            )
        )