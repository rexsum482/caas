from django.conf import settings
from django.db import models


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.save(update_fields=["updated_at"])

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.save(update_fields=["updated_at"])

class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        related_name="items",
        on_delete=models.CASCADE,
    )
    product_id = models.IntegerField()
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    sku = models.CharField(max_length=24)
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ("cart", "product_id")