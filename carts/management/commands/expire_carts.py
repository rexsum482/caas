from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from carts.models import Cart


class Command(BaseCommand):
    help = "Expire abandoned carts"

    def handle(self, *args, **options):
        days = getattr(settings, "CART_ABANDONED_DAYS", 30)
        cutoff = timezone.now() - timedelta(days=days)

        qs = Cart.objects.filter(updated_at__lt=cutoff)

        count = qs.count()
        qs.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Expired {count} abandoned carts"
            )
        )