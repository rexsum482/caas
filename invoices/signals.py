from django.db import transaction
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Invoice

@receiver(pre_save, sender=Invoice)
def set_invoice_defaults(sender, instance: Invoice, **kwargs):
    if instance.pk:
        return

    today = timezone.now().date()
    prefix = today.strftime("%y%m%d")

    with transaction.atomic():
        last_invoice = (
            Invoice.objects
            .select_for_update()
            .filter(issue_date=today)
            .order_by("-invoice_number")
            .first()
        )

        if last_invoice:
            last_num = int(last_invoice.invoice_number[-3:])
            next_num = last_num + 1
        else:
            next_num = 1

        instance.invoice_number = f"{prefix}{next_num:03d}"

    instance.amount = Decimal("0.00")
    instance.due_date = today + timedelta(days=3)

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