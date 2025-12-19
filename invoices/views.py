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

from .permissions import IsInvoiceOwner

class CustomerInvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated, IsInvoiceOwner]

    def get_queryset(self):
        return Invoice.objects.filter(
            customer__email=self.request.user.email
        )
