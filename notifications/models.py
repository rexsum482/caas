from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from invoices.models import Invoice
from django.contrib.auth import get_user_model
User = get_user_model()
class Notification(models.Model):
    TYPE_CHOICES = [
        ("A", "Appointment"),
        ("I", "Invoice"),
        ("S", "System"),
        ("M", "Message"),
        ("G", "General"),
        ("R", "Reminder"),
        ("P", "Payment"),
        ("U", "Update"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, blank=True, null=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    type = models.CharField(
        max_length=1,
        choices=TYPE_CHOICES,
        default="S",
        blank=True, null=True
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def time_since(self):
        from django.utils import timezone
        from datetime import timedelta

        delta = timezone.now() - self.created_at

        if delta < timedelta(seconds=20):
            return "just now"
        if delta < timedelta(minutes=1):
            return f"{delta.seconds} seconds ago"
        if delta < timedelta(hours=1):
            return f"{delta.seconds // 60} minutes ago"
        if delta < timedelta(days=1):
            return f"{delta.seconds // 3600} hours ago"
        return f"{delta.days} days ago"

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

class Device(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
