from django.conf import settings
from django.db import models
from products.models import Product
from carts.models import Cart

class Order(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    square_payment_id = models.CharField(max_length=255, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=30,
        default="pending",
    )
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        related_name="items",
        on_delete=models.CASCADE,
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def subtotal(self):
        return self.price * self.quantity
    
class ShippingMethod(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    active = models.BooleanField(default=True)

class CheckoutSession(models.Model):

    STATUS_CHOICES = [
        ("open", "Open"),
        ("payment_pending", "Payment Pending"),
        ("paid", "Paid"),
        ("expired", "Expired"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="checkout_sessions"
    )
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE
    )
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default="open"
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    idempotency_key = models.CharField(
        max_length=255,
        unique=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"CheckoutSession {self.id}"