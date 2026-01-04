from rest_framework import viewsets, permissions, decorators, response
from rest_framework.authentication import TokenAuthentication
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from rest_framework.response import Response
from decimal import Decimal, ROUND_HALF_UP
from notifications.models import Notification
from .pdf import generate_invoice_pdf
from .utils import send_invoice_email
from .models import Invoice, Part, Labor, Payment
from .serializers import (
    InvoiceSerializer,
    PartSerializer,
    LaborSerializer,
    PaymentSerializer,
)

def create_invoice_notification(request, invoice, message):
    if request.user.email == invoice.customer.email:
        user=request.user
        if not user.is_superuser:
            Notification.objects.create(
                user=user,
                invoice=invoice,
                title=f"Invoice {invoice.invoice_number} Updated",
                content=message,
                type="I",
            )
        else:
            Notification.objects.create(
                invoice=invoice,
                title=f"Invoice {invoice.invoice_number} Updated",
                content=message,
                type="I",
            )
    else:
        Notification.objects.create(
            invoice=invoice,
            title=f"Invoice {invoice.invoice_number} Updated",
            content=message,
            type="I",
        )


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.all()

        # 🔒 Non-admin users only see their own invoices
        if not user.is_superuser:
            qs = qs.filter(customer__email__iexact=user.email)

        # 🔍 Optional filter: ?customer=<id>
        customer_id = self.request.query_params.get("customer")
        if customer_id:
            qs = qs.filter(customer_id=customer_id)

        return qs

    def retrieve(self, request, *args, **kwargs):
        invoice = self.get_object()
        user = request.user

        if (
            not user.is_superuser
            and invoice.customer.email.lower() != user.email.lower()
        ):
            return Response(
                {"detail": "Not authorized to view Invoice."},
                status=403
            )

        return super().retrieve(request, *args, **kwargs)

    def perform_update(self, serializer):
        invoice = self.get_object()
        user = self.request.user

        if (
            not user.is_superuser
            and invoice.customer.email.lower() != user.email.lower()
        ):
            raise PermissionDenied("Not authorized to update Invoice.")

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user

        if not user.is_superuser:
            raise PermissionDenied("Not authorized to delete Invoice.")

        create_invoice_notification(
            self.request,
            instance,
            f"Invoice #{instance.invoice_number} destroyed"
        )
        instance.delete()

    # -------------------------
    # Custom actions
    # -------------------------

    @decorators.action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_file = generate_invoice_pdf(invoice)

        response = HttpResponse(pdf_file, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="invoice_{invoice.invoice_number}.pdf"'
        )
        return response

    @decorators.action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.paid = not invoice.paid
        invoice.save(update_fields=["paid"])

        return Response({
            "paid": invoice.paid,
            "message": "Invoice marked as paid" if invoice.paid else "Invoice marked as unpaid"
        })

    @decorators.action(detail=True, methods=["get"])
    def send_email(self, request, pk=None):
        invoice = self.get_object()
        to_email = request.query_params.get("to")

        result = send_invoice_email(
            to_email=to_email,
            invoice=invoice
        )

        return Response({"message": result})

class PartViewSet(viewsets.ModelViewSet):
    queryset = Part.objects.select_related("invoice").all()
    serializer_class = PartSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

class LaborViewSet(viewsets.ModelViewSet):
    queryset = Labor.objects.select_related("invoice").all()
    serializer_class = LaborSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("invoice").all()
    serializer_class = PaymentSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        payment = serializer.save()
        payment.invoice.update_payment_status()

    def retrieve(self, request, *args, **kwargs):
        amount = self.get_object().amount
        self.get_object().amount = amount.quantize(Decimal('0.00'), rounding=ROUND_HALF_UP)
        self.get_object().save()
        return super().retrieve(request, *args, **kwargs)

from rest_framework import viewsets, permissions
from django.http import HttpResponse, Http404
from .models import Invoice
from .serializers import InvoiceSerializer
from .pdf import generate_invoice_pdf  # <-- your PDF generator

class CustomerInvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Customer-facing invoice access.
    /api/customer-invoices/<id>/ returns PDF
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [TokenAuthentication]
    queryset = Invoice.objects.all()

    def retrieve(self, request, *args, **kwargs):
        invoice_id = kwargs.get("pk")

        try:
            invoice = Invoice.objects.get(pk=invoice_id)
        except Invoice.DoesNotExist:
            raise Http404("Invoice not found")

        # OPTIONAL: lock invoice to customer email if provided
        email = request.query_params.get("email")
        if email and invoice.customer.email.lower() != email.lower():
            raise Http404("Invoice not found")

        # Generate PDF
        pdf = generate_invoice_pdf(invoice)

        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="invoice_{invoice.invoice_number}.pdf"'
        )
        return response