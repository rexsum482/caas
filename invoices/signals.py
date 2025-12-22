# invoices/signals.py
from django.db import transaction
from django.db.models.signals import pre_save, post_save
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
    - Set default amount
    - Set default due date
    """
    if instance.pk:
        return

    today = timezone.now().date()
    prefix = today.strftime("%y%m%d")

    with transaction.atomic():
        count_today = (
            Invoice.objects
            .select_for_update()
            .filter(issue_date=today)
            .count()
        )
        instance.invoice_number = f"{prefix}{count_today + 1:03d}"

    instance.amount = Decimal("0.00")
    instance.due_date = today + timedelta(days=3)

@receiver(post_save, sender=Invoice)
def update_invoice_amount(sender, instance: Invoice, created, update_fields=None, **kwargs):
    """
    Recalculate invoice amount when tax_rate or discount changes
    """
    if created:
        return

    # If update_fields is provided, only recalc when relevant
    if update_fields is not None:
        if not {"tax_rate", "discount"} & set(update_fields):
            return

    amount = instance.recalculate_amount()

    Invoice.objects.filter(pk=instance.pk).update(amount=amount)