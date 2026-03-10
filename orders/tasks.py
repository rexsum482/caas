from django.utils import timezone
from .models import CheckoutSession

def expire_sessions():

    CheckoutSession.objects.filter(
        status="open",
        expires_at__lt=timezone.now()
    ).update(status="expired")