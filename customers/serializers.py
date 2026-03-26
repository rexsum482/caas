from rest_framework import serializers
from .models import Customer, ShippingAddress, BillingAddress

class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

class BillingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingAddress
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

class CustomerSerializer(serializers.ModelSerializer):
    shipping_addresses = ShippingAddressSerializer(many=True,required=False)
    billing_addresses = BillingAddressSerializer(many=True,required=False)
    class Meta:
        model = Customer
        fields = "__all__"

    def create(self, validated_data):
        shipping_data = validated_data.pop("shipping_addresses", [])
        billing_data = validated_data.pop("billing_addresses", [])
        customer = Customer.objects.create(**validated_data)

        for address in shipping_data:
            ShippingAddress.objects.get_or_create(customer=customer,**address)

        for address in billing_data:
            BillingAddress.objects.get_or_create(customer=customer,**address)

        return customer
    