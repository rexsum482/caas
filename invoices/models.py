from django.db import models, transaction
from django.utils import timezone
from decimal import Decimal
from django.db.models import Sum, F, DecimalField, ExpressionWrapper

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
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("8.25")  # ✅ FIX
    )
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer}"

    def total_payments(self):
        return self.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    
    def balance_due(self):
        return max(self.amount - self.total_payments(), 0)

    def update_payment_status(self):
        """Automatically mark paid/unpaid depending on payment total."""
        if self.total_payments() >= self.amount:
            self.mark_as_paid()
        else:
            self.mark_as_unpaid()

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
        try:
            delta = self.due_date - timezone.now().date()
        except TypeError:
            return None
        return delta.days
    
    def is_overdue(self):
        from django.utils import timezone
        return timezone.now().date() > self.due_date and not self.paid


    def _generate_invoice_number(self):
        today = timezone.now().date()
        prefix = today.strftime("%y%m%d")

        with transaction.atomic():
            sequence, created = InvoiceSequence.objects.select_for_update().get_or_create(
                date=today
            )

            sequence.last_number += 1
            sequence.save(update_fields=["last_number"])

            return f"{prefix}{sequence.last_number:03d}"

    def recalculate_amount(self, save=True):
        """
        Recalculate invoice total using DB aggregation (fast, scalable).
        """

        parts_total = (
            self.line_items
            .aggregate(
                total=Sum(
                    ExpressionWrapper(
                        F("quantity") * F("unit_price"),
                        output_field=DecimalField(max_digits=12, decimal_places=2)
                    )
                )
            )["total"] or Decimal("0.00")
        )

        labor_total = (
            self.labor_items
            .aggregate(
                total=Sum(
                    ExpressionWrapper(
                        F("hours") * F("hourly_rate"),
                        output_field=DecimalField(max_digits=12, decimal_places=2)
                    )
                )
            )["total"] or Decimal("0.00")
        )

        subtotal = parts_total + labor_total
        tax = subtotal * (self.tax_rate / Decimal("100"))
        total = subtotal + tax - (self.discount or Decimal("0.00"))

        self.amount = total

        if save:
            self.save(update_fields=["amount"])

        return total

    def save(self, *args, **kwargs):
        if not self.pk and not self.invoice_number:
            self.invoice_number = self._generate_invoice_number()

        super().save(*args, **kwargs)

class Part(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='line_items')
    description = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    position = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"[Part] {self.description} for Invoice {self.invoice.invoice_number}"
    
    class Meta:
        ordering = ['position']
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
    position = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"[Labor] {self.description} for Invoice {self.invoice.invoice_number}"
    
    class Meta:
        ordering = ['position']
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
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
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
        super().save(*args, **kwargs)
        self.apply_to_invoice()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.apply_to_invoice()

    def apply_to_invoice(self):
        if self.amount >= self.invoice.amount:
            self.invoice.mark_as_paid()
        else:
            self.invoice.mark_as_unpaid()
        self.invoice.save()

    def refund(self):
        # Logic for refunding the payment
        pass

    def outstanding_amount(self):
        return max(0, self.invoice.amount - self.amount)
    
class InvoiceSequence(models.Model):
    date = models.DateField(unique=True)
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "invoice_daily_sequence"