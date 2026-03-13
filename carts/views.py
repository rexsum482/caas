from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CartItem
from .serializers import CartSerializer, CartItemSerializer
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
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))
        if not product_id:
            return Response(
                {"detail": "product_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart = Cart(request)
        cart.add({
            "id": product_id,
            "quantity": quantity,
        })
        return Response(
            {"detail": "Item added"},
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, pk=None):
        cart = Cart(request)
        cart.remove(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def update_quantity(self, request, pk=None):
        quantity = request.data.get("quantity")
        cart = Cart(request)
        cart.update(pk, int(quantity))
        return Response({"detail": "Quantity updated"})

    @action(detail=False, methods=["post"])
    def clear(self, request):
        cart = Cart(request)
        cart.clear()
        return Response({"detail": "Cart cleared"})