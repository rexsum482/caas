from django.db import models, transaction
from django.utils import timezone
from decimal import Decimal

class Invoice(models.Model):
    invoice_number = models.CharField(
        max_length=20,
        unique=True,
        blank=True
    )
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(blank=True, null=True)
    paid = models.BooleanField(default=False)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer}"

    def mark_as_paid(self):
        self.paid = True
        self.save()
    def mark_as_unpaid(self):
        self.paid = False
        self.save()
    
    class Meta:
        ordering = ['-issue_date']
        verbose_name = "Invoice"
        verbose_name_plural = "Invoices"
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['customer']),
        ]
    def days_until_due(self):
        from django.utils import timezone
        delta = self.due_date - timezone.now().date()
        return delta.days
    
    def is_overdue(self):
        from django.utils import timezone
        return timezone.now().date() > self.due_date and not self.paid
    
    def generate_invoice_number(self):
        today = timezone.now().date()
        prefix = today.strftime("%y%m%d")  # YYMMDD

        with transaction.atomic():
            count_today = (
                Invoice.objects
                .select_for_update()
                .filter(issue_date=today)
                .count()
            )
            return f"{prefix}{count_today + 1:03d}"
        
    def recalculate_amount(self):
        parts_total = sum(
            part.total_price() for part in self.line_items.all()
        )
        labor_total = sum(
            labor.total_price() for labor in self.labor_items.all()
        )
        self.amount = Decimal(parts_total) + Decimal(labor_total)
        self.save(update_fields=["amount"])

    def save(self, *args, **kwargs):
        # Custom save logic can be added here
        super().save(*args, **kwargs)

class Part(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='line_items')
    description = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"[Part] {self.description} for Invoice {self.invoice.invoice_number}"
    
    class Meta:
        ordering = ['id']
        verbose_name = "Part"
        verbose_name_plural = "Parts"
        indexes = [
            models.Index(fields=['invoice']),
            models.Index(fields=['description']),
        ]
    
    def total_price(self):
        return self.quantity * self.unit_price
    
    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.invoice.recalculate_amount()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.recalculate_amount()

class Labor(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='labor_items')
    description = models.CharField(max_length=255)
    hours = models.DecimalField(max_digits=5, decimal_places=2)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"[Labor] {self.description} for Invoice {self.invoice.invoice_number}"
    
    class Meta:
        ordering = ['id']
        verbose_name = "Labor"
        verbose_name_plural = "Labor Items"
        indexes = [
            models.Index(fields=['invoice']),
            models.Index(fields=['description']),
        ]
    
    def total_price(self):
        return self.hours * self.hourly_rate

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.invoice.recalculate_amount()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.recalculate_amount()

class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE)
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=50)

    def __str__(self):
        return f"Payment of {self.amount} for Invoice {self.invoice.invoice_number}"
    
    class Meta:
        ordering = ['-payment_date']
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        indexes = [
            models.Index(fields=['invoice']),
            models.Index(fields=['payment_date']),
        ]
    
    def save(self, *args, **kwargs):
        # Custom save logic can be added here
        super().save(*args, **kwargs)

    def apply_to_invoice(self):
        if self.amount >= self.invoice.amount:
            self.invoice.mark_as_paid()
        self.invoice.save()

    def refund(self):
        # Logic for refunding the payment
        pass

    def outstanding_amount(self):
        return max(0, self.invoice.amount - self.amount)
    
