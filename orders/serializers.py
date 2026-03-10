from rest_framework import serializers
from .models import Order, OrderItem, ShippingMethod, CheckoutSession

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