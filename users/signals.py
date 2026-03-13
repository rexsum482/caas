from rest_framework.authtoken.models import Token
from django.db.models.signals import post_save
from django.dispatch import receiver
from .utils import send_verification_email
from .models import CustomUser

@receiver(post_save, sender=CustomUser)
def handle_user_creation(sender, instance, created, **kwargs):
    if created:
        Token.objects.create(user=instance)
        send_verification_email(instance)