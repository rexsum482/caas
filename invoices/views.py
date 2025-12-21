from rest_framework import viewsets, permissions, decorators, response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse

from .models import Invoice, Part, Labor, Payment
from .serializers import (
    InvoiceSerializer,
    PartSerializer,
    LaborSerializer,
    PaymentSerializer,
)

from .pdf import generate_invoice_pdf

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("customer").all()
    serializer_class = InvoiceSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return self.queryset

    @decorators.action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_file = generate_invoice_pdf(invoice)

        response = HttpResponse(pdf_file, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="invoice_{invoice.invoice_number}.pdf"'
        )
        return response

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
        payment.apply_to_invoice()

from rest_framework import viewsets, permissions
from django.http import HttpResponse, Http404
from .models import Invoice
from .serializers import InvoiceSerializer
from .pdf import render_invoice_pdf  # <-- your PDF generator

class CustomerInvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Customer-facing invoice access.
    /api/customer-invoices/<id>/ returns PDF
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.AllowAny]
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
        pdf = render_invoice_pdf(invoice)

        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'inline; filename="invoice_{invoice.invoice_number}.pdf"'
        )
        return response