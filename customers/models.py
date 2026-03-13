from django.db import models

class Customer(models.Model):
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
    first_name = models.CharField(max_length=24)
    last_name = models.CharField(max_length=32)
    street_address = models.CharField(max_length=128)
    apt_suite =models.CharField(max_length=128, blank=True, null=True)
    city =models.CharField(max_length=128)
    state = models.CharField(max_length=2, choices=STATE_CHOICES, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class ShippingAddress(models.Model):
    customer = models.ForeignKey(Customer, related_name="shipping_addresses", on_delete=models.CASCADE)
    street_address = models.CharField(max_length=128)
    apt_suite =models.CharField(max_length=128, blank=True, null=True)
    city =models.CharField(max_length=128)
    state = models.CharField(max_length=2, choices=Customer.STATE_CHOICES, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.street_address}, {self.city}, {self.state} {self.zip_code}"
    
class BillingAddress(models.Model):
    customer = models.ForeignKey(Customer, related_name="billing_addresses", on_delete=models.CASCADE)
    street_address = models.CharField(max_length=128)
    apt_suite =models.CharField(max_length=128, blank=True, null=True)
    city =models.CharField(max_length=128)
    state = models.CharField(max_length=2, choices=Customer.STATE_CHOICES, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.street_address}, {self.city}, {self.state} {self.zip_code}"