from rest_framework import viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import AllowAny
from .models import Customer, ShippingAddress, BillingAddress
from .serializers import (
    CustomerSerializer,
    ShippingAddressSerializer,
    BillingAddressSerializer,
)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("-id")
    serializer_class = CustomerSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Customer.objects.all().order_by("-id")
        return Customer.objects.none()

class ShippingAddressViewSet(viewsets.ModelViewSet):
    queryset = ShippingAddress.objects.all().order_by("-id")
    serializer_class = ShippingAddressSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return ShippingAddress.objects.all().order_by("-id")
        return ShippingAddress.objects.none()

class BillingAddressViewSet(viewsets.ModelViewSet):
    queryset = BillingAddress.objects.all().order_by("-id")
    serializer_class = BillingAddressSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return BillingAddress.objects.all().order_by("-id")
        return BillingAddress.objects.none()