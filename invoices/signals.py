from django.db import transaction
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import Invoice


@receiver(pre_save, sender=Invoice)
def set_invoice_defaults(sender, instance: Invoice, **kwargs):
    """
    Runs ONLY on creation:
    - Generate invoice number
    - Set amount to 0.00
    - Set due date to 3 days from issue date
    """

    if instance.pk:
        # Existing invoice — do nothing
        return

    today = timezone.now().date()
    prefix = today.strftime("%y%m%d")  # YYMMDD

    with transaction.atomic():
        count_today = (
            Invoice.objects
            .select_for_update()
            .filter(issue_date=today)
            .count()
        )

        instance.invoice_number = f"{prefix}{count_today + 1:03d}"

    # Default amount
    instance.amount = Decimal("0.00")

    # Default due date (3 days from issue date)
    instance.due_date = today + timedelta(days=3)
