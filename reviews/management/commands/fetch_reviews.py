from django.core.management.base import BaseCommand
from reviews.fetch_reviews import fetch_google_reviews

class Command(BaseCommand):
    help = "Sync Google reviews"

    def handle(self, *args, **kwargs):
        fetch_google_reviews()
        self.stdout.write(self.style.SUCCESS("Google reviews synced"))
