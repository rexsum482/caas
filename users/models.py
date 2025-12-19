from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from rest_framework.authtoken.models import Token
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid
from django.core.mail import send_mail
from django.conf import settings

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        if not username:
            raise ValueError("The Username field must be set")

        email = self.normalize_email(email).lower()  # Normalize email
        username = username.lower()  # Normalize username

        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, username, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    email_confirmed = models.BooleanField(default=False)
    last_active = models.CharField(default=".", max_length=512)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'  # Use username for login
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._initial_email = self.email

    def save(self, *args, **kwargs):
        # Normalize email and username to lower case to ensure case-insensitive matching
        if self.email:
            self.email = self.email.lower()
        if self.username:
            self.username = self.username.lower()

        if (
            self.pk
            and CustomUser.objects.filter(pk=self.pk)
            .values_list("email", flat=True)
            .first()
            != self.email
        ):
            self.email_confirmed = False
        super().save(*args, **kwargs)

    # Custom related_name to resolve reverse accessor clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_set',  # Custom reverse relationship for groups
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_permissions_set',  # Custom reverse relationship for user_permissions
        blank=True
    )


class EmailVerificationToken(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="verification_token")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verification token for {self.user.username}"


@receiver(post_save, sender=CustomUser)
def handle_user_creation(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)  # keep DRF token

        # create a verification token
        verification_token, _ = EmailVerificationToken.objects.get_or_create(user=instance)

        # build verification URL (adjust frontend/backend domain as needed)
        verification_link = f"{settings.FRONTEND_URL}/verify-email/{verification_token.token}/"

        send_mail(
            subject="Verify your email address",
            message=f"Hello {instance.username}, please verify your email by clicking this link: {verification_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.email],
            fail_silently=False,
        )
