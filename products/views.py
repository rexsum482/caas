from rest_framework import viewsets, permissions, authentication
from .models import Product, ProductImage
from .serializers import ProductSerializer, ProductImageSerializer

class IsSuperUserOrReadOnly(permissions.BasePermission):
    """
    Read for everyone
    Write only for superusers
    """

    def has_permission(self, request, view):

        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user and request.user.is_superuser


class ProductViewSet(viewsets.ModelViewSet):

    serializer_class = ProductSerializer
    permission_classes = [IsSuperUserOrReadOnly]
    authentication_classes = [authentication.TokenAuthentication]

    def get_queryset(self):

        if self.request.user and self.request.user.is_superuser:
            return Product.objects.all()

        return Product.objects.filter(active=True)


class ProductImageViewSet(viewsets.ModelViewSet):

    serializer_class = ProductImageSerializer
    permission_classes= [permissions.AllowAny]
    authentication_classes = [authentication.TokenAuthentication]

    def get_queryset(self):

        queryset = ProductImage.objects.all()
        product_id = self.kwargs.get("product_pk")

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        return queryset

    def perform_create(self, serializer):
        if self.request.user.is_superuser:
            product_id = self.kwargs.get("product_pk")
            serializer.save(product_id=product_id)
