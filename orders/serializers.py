from rest_framework import serializers
from .models import Order, OrderItem, ShippingMethod, CheckoutSession
from rest_framework import serializers
from orders.models import Order, OrderItem
from products.serializers import ProductSerializer


class OrderItemSerializer(serializers.ModelSerializer):

    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "quantity",
            "price",
            "subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "total",
            "items",
            "created_at",
        ]
class ShippingMethodSerializer(serializers.ModelSerializer):

    class Meta:
        model = ShippingMethod
        fields = "__all__"

class OrderItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderItem
        fields = "__all__"

class OrderSerializer(serializers.ModelSerializer):
    
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_method = ShippingMethodSerializer(read_only=True)

    class Meta:
        model = Order
        fields = "__all__"

class CheckoutSessionSerializer(serializers.ModelSerializer):

    class Meta:
        model = CheckoutSession
        fields = "__all__"
        read_only_fields = [
            "status",
            "idempotency_key",
            "created_at"
        ]