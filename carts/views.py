from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import CartItemSerializer, CartSerializer
from .utils import Cart


class CartViewSet(viewsets.ViewSet):
    
    def list(self, request):
        cart = Cart(request)
        data = {
            "items": cart.items(),
            "total": cart.total(),
        }
        serializer = CartSerializer(data)
        return Response(serializer.data)

    def create(self, request):
        """
        Add item to cart
        """
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = Cart(request)
        cart.add(serializer.validated_data)

        return Response(
            {"detail": "Item added"},
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, pk=None):
        """
        Remove item from cart
        """
        cart = Cart(request)
        cart.remove(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def update_quantity(self, request, pk=None):
        quantity = request.data.get("quantity")

        if not quantity:
            return Response(
                {"detail": "Quantity required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = Cart(request)
        cart.update(pk, int(quantity))

        return Response({"detail": "Quantity updated"})

    @action(detail=False, methods=["post"])
    def clear(self, request):
        cart = Cart(request)
        cart.clear()
        return Response({"detail": "Cart cleared"})