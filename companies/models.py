from django.db import models
from django.conf import settings
from django.utils.text import slugify


def generate_unique_subdomain(name):
    base = slugify(name).replace("-", "")
    subdomain = base
    counter = 1

    while Company.objects.filter(subdomain=subdomain).exists():
        subdomain = f"{base}{counter}"
        counter += 1

    return subdomain


def default_business_hours():
    return {
        "0": ["08:00", "18:00"],
        "1": ["08:00", "18:00"],
        "2": ["08:00", "18:00"],
        "3": ["08:00", "18:00"],
        "4": ["08:00", "18:00"],
        "5": ["09:00", "15:00"],
        "6": ["09:00", "15:00"],
    }


class Company(models.Model):

    SERVICE_CHOICES = [
        ("plumbing", "Plumbing"),
        ("hvac", "HVAC"),
        ("electrical", "Electrical"),
        ("roofing", "Roofing"),
        ("appliance", "Appliance Repair"),
        ("general", "General Handyman"),
        ("landscaping", "Landscaping"),
        ("cleaning", "Cleaning"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_companies"
    )

    subdomain = models.SlugField(unique=True)

    services = models.JSONField(default=list, blank=True)

    name = models.CharField(max_length=128)
    short_name = models.CharField(max_length=64, blank=True)

    admin_email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)

    # 📍 Address
    street_address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=10, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)

    # 🌍 GEO LOCATION
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # 🎨 Branding
    primary_color = models.CharField(max_length=20, default="#2f80ed")
    accent_color = models.CharField(max_length=20, default="#215199ff")
    alert_color = models.CharField(max_length=20, default="#dc2626")
    warning_color = models.CharField(max_length=20, default="#f59e0b")
    success_color = models.CharField(max_length=20, default="#22c55e")

    business_hours = models.JSONField(default=default_business_hours)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["zip_code"]),
            models.Index(fields=["city", "state"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.subdomain:
            self.subdomain = generate_unique_subdomain(self.name)
        super().save(*args, **kwargs)

class CompanyMembership(models.Model):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("employee", "Employee"),
        ("customer", "Customer"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships"
    )

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="memberships"
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "company")

    def __str__(self):
        return f"{self.user} -> {self.company} ({self.role})"
