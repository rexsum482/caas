from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=64, unique=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    track_inventory = models.BooleanField(default=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def in_stock(self):
        if not self.track_inventory:
            return True
        return self.stock > 0

    def reserve(self, quantity):

        if self.track_inventory:

            if self.stock < quantity:
                raise ValueError("Insufficient inventory")

            self.stock -= quantity
            self.save(update_fields=["stock"])

    def release(self, quantity):

        if self.track_inventory:

            self.stock += quantity
            self.save(update_fields=["stock"])

    def __str__(self):
        return self.name
    
class ProductImage(models.Model):

    product = models.ForeignKey(
        Product,
        related_name="images",
        on_delete=models.CASCADE
    )

    image = models.ImageField(
        upload_to="products/"
    )

    alt = models.CharField(
        max_length=255,
        blank=True
    )

    is_primary = models.BooleanField(default=False)