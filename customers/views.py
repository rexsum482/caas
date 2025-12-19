from rest_framework import viewsets
from .models import Customer
from .serializers import CustomerSerializer
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import AllowAny

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Customer.objects.all()
        return Customer.objects.none()