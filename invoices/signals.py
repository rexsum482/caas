from django.db import transaction
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Invoice

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.cache import cache
from invoices.models import Invoice

@receiver(post_save, sender=Invoice)
def clear_dashboard_cache(sender, **kwargs):
    cache.delete("admin_dashboard_v1")

@receiver(post_save, sender=Invoice)
def update_invoice_amount(sender, instance: Invoice, created, update_fields=None, **kwargs):
    if created:
        return

    # If update_fields is provided, only recalc when relevant
    if update_fields is not None:
        if not {"tax_rate", "discount"} & set(update_fields):
            return

    amount = instance.recalculate_amount()

    Invoice.objects.filter(pk=instance.pk).update(amount=amount)