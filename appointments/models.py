from django.db import models, transaction
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import uuid

User = get_user_model()

class Appointment(models.Model):
    STATE_CHOICES = [
        ("AK", "Alaska"),
        ("AL", "Alabama"),
        ("AR", "Arkansas"),
        ("AZ", "Arizona"),
        ("CA", "California"),
        ("CO", "Colorado"),
        ("CT", "Connecticut"),
        ("DE", "Delaware"),
        ("FL", "Florida"),
        ("GA", "Georgia"),
        ("HI", "Hawaii"),
        ("ID", "Idaho"),
        ("IL", "Illinois"),
        ("IN", "Indiana"),
        ("IA", "Iowa"),
        ("KS", "Kansas"),
        ("KY", "Kentucky"),
        ("LA", "Louisiana"),
        ("ME", "Maine"),
        ("MD", "Maryland"),
        ("MA", "Massachusetts"),
        ("MI", "Michigan"),
        ("MN", "Minnesota"),
        ("MS", "Mississippi"),
        ("MO", "Missouri"),
        ("MT", "Montana"),
        ("NE", "Nebraska"),
        ("NV", "Nevada"),
        ("NH", "New Hampshire"),
        ("NJ", "New Jersey"),
        ("NM", "New Mexico"),
        ("NY", "New York"),
        ("NC", "North Carolina"),
        ("ND", "North Dakota"),
        ("OH", "Ohio"),
        ("OK", "Oklahoma"),
        ("OR", "Oregon"),
        ("PA", "Pennsylvania"),
        ("RI", "Rhode Island"),
        ("SC", "South Carolina"),
        ("SD", "South Dakota"),
        ("TN", "Tennessee"),
        ("TX", "Texas"),
        ("UT", "Utah"),
        ("VT", "Vermont"),
        ("VA", "Virginia"),
        ("WA", "Washington"),
        ("WV", "West Virginia"),
        ("WI", "Wisconsin"),
        ("WY", "Wyoming"),
    ]
    STATUS_CHOICES = [
        ("P", "Pending"),
        ("A", "Accepted"),
        ("D", "Declined"),
    ]

    customer_first_name = models.CharField(max_length=50)
    customer_last_name = models.CharField(max_length=50)
    customer_email = models.EmailField()
    customer_phone_number = models.CharField(max_length=25, blank=True, null=True)

    customer_street_address = models.CharField(max_length=100)
    customer_apt_suite = models.CharField(max_length=50, blank=True, null=True)
    customer_city = models.CharField(max_length=50)
    customer_state = models.CharField(max_length=2, blank=True, null=True, choices=STATE_CHOICES)
    customer_zip_code = models.CharField(max_length=10, blank=True, null=True)

    requested_date = models.DateField()
    requested_time = models.TimeField()
    description = models.TextField(blank=True, null=True)

    accepted = models.CharField(
        max_length=1,
        choices=STATUS_CHOICES,
        default="P",
    )

    reschedule_token = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
    )

    def __str__(self):
        return (
            f"{self.customer_first_name} {self.customer_last_name} "
            f"- {self.requested_date} at {self.requested_time}"
        )

    # ---------------------------------
    # Query helpers
    # ---------------------------------
    @classmethod
    def pending(cls):
        return cls.objects.filter(accepted="P")

    @classmethod
    def accepted_appointments(cls):
        return cls.objects.filter(accepted="A")

    # ---------------------------------
    # Domain actions
    # ---------------------------------
    def accept_request(self):
        """
        Accept this appointment and automatically decline
        all other appointments for the same time slot.
        """
        with transaction.atomic():
            # Validate conflict ONLY for acceptance
            self.full_clean()

            # Accept this appointment
            self.accepted = "A"
            self.save(update_fields=["accepted"])

            # Decline all others for same slot
            Appointment.objects.filter(
                requested_date=self.requested_date,
                requested_time=self.requested_time,
                accepted="P",
            ).exclude(pk=self.pk).update(accepted="D")

    def decline_request(self):
        """
        Decline without triggering conflict validation.
        """
        self.accepted = "D"
        self.save(update_fields=["accepted"])

    # ---------------------------------
    # Validation
    # ---------------------------------
    def clean(self):
        """
        Only block conflicts when attempting to ACCEPT.
        """
        if self.accepted != "A":
            return

        conflict = Appointment.objects.filter(
            requested_date=self.requested_date,
            requested_time=self.requested_time,
            accepted="A",
        ).exclude(pk=self.pk)

        if conflict.exists():
            raise ValidationError(
                {"requested_time": "This time slot is already booked."}
            )

    # ---------------------------------
    # Save override
    # ---------------------------------
    def save(self, *args, **kwargs):
        """
        Only auto-validate on normal saves.
        Accept/decline should be done via methods.
        """
        if "update_fields" not in kwargs:
            self.full_clean()
        super().save(*args, **kwargs)

class BlackoutDate(models.Model): 
    date = models.DateField(unique=True)
    reason = models.CharField(max_length=100, blank=True)
    def __str__(self):
        return f"{self.date} - {self.reason or 'Blackout'}"