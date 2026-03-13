from django.conf import settings
from django.db import models
from django.db.models import F, Sum, DecimalField
from products.models import Product


class Cart(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )

    updated_at = models.DateTimeField(auto_now=True)

    def total(self):

        return (
            self.items
            .annotate(
                subtotal=F("product__price") * F("quantity")
            )
            .aggregate(
                total=Sum("subtotal", output_field=DecimalField())
            )["total"]
            or 0
        )

    def __str__(self):
        return f"{self.user} cart"


class CartItem(models.Model):

    cart = models.ForeignKey(
        Cart,
        related_name="items",
        on_delete=models.CASCADE,
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
    )

    quantity = models.PositiveIntegerField()

    class Meta:
        unique_together = ("cart", "product")

    def subtotal(self):
        return self.product.price * self.quantity