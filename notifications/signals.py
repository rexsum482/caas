from django.db.models.signals import post_save
from django.dispatch import receiver
from invoices.models import Invoice, Payment
from .models import Notification
from .ws import push_notification

# This signal listens to all Notification creations
@receiver(post_save, sender=Notification)
def send_notification_ws(sender, instance, created, **kwargs):
    if created:
        # Push to connected users via WebSocket
        push_notification(instance)

@receiver(post_save, sender=Invoice)
def invoice_status_notification(sender, instance, created, **kwargs):
    if created:
        return

    title = "Invoice Updated"
    content = f"Invoice #{instance.invoice_number} was updated."

    notif = Notification.objects.create(
        user=instance.customer.user,
        title=title,
        content=content,
    )

    push_notification(notif)


@receiver(post_save, sender=Payment)
def payment_notification(sender, instance, created, **kwargs):
    if not created:
        return

    invoice = instance.invoice
    notif = Notification.objects.create(
        user=invoice.customer.user,
        title="Payment Received",
        content=f"${instance.amount} payment applied to Invoice #{invoice.invoice_number}",
    )

    push_notification(notif)
