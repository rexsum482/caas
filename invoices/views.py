from rest_framework import viewsets, permissions, decorators, response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from rest_framework.response import Response
from decimal import Decimal, ROUND_HALF_UP
from django.core.mail import send_mail

from .models import Invoice, Part, Labor, Payment
from .serializers import (
    InvoiceSerializer,
    PartSerializer,
    LaborSerializer,
    PaymentSerializer,
)

from .pdf import generate_invoice_pdf
from .utils import send_invoice_email


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        customer = self.request.query_params.get("customer")
        user = self.request.user
        if user.is_superuser:
            if customer:
                return self.queryset.filter(customer__id=customer)
            return self.queryset
        return self.queryset.filter(user=user, customer__id=customer) if customer else self.queryset.filter(user=user)

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
        invoice.save()

        return Response({
            "paid": invoice.paid,
            "message": "Invoice marked as paid" if invoice.paid else "Invoice marked as unpaid"
        })
    
    @decorators.action(detail=True, methods=["get"])
    def send_email(self, request, pk=None):
        invoice = self.get_object()
        to_email = request.GET.get("to")
        send_inv = send_invoice_email(to_email=to_email, invoice=invoice)
        return Response({"message": send_inv})

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