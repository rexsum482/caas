from rest_framework.views import exception_handler
import logging
from django.core.mail import send_mail
from django.conf import settings
from .models import EmailVerificationToken

def send_verification_email(user):
    token_obj, _ = EmailVerificationToken.objects.get_or_create(user=user)

    verification_link = (
        f"{settings.FRONTEND_URL}/api/users/verify-email/{token_obj.token}/"
    )

    send_mail(
        subject="Verify your email address",
        message=(
            f"Hello {user.username},\n\n"
            f"Please verify your email by clicking the link below:\n\n"
            f"{verification_link}\n\n"
            f"If you didn’t create this account, ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    
logger = logging.getLogger("django.request")

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request = context.get("request")

    logger.error(
        f"API Exception: {exc}\n"
        f"Path: {request.get_full_path()}\n"
        f"Method: {request.method}\n"
        f"Headers: {dict(request.headers)}\n"
        f"Data: {request.data}"
    )

    return response
