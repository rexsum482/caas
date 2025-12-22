from rest_framework import serializers
from .models import Invoice, Part, Labor, Payment

class PartSerializer(serializers.ModelSerializer):
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Part
        fields = [
            "id",
            "invoice",
            "description",
            "quantity",
            "unit_price",
            "total_price",
            'position',
        ]
        read_only_fields = ["id", "total_price"]

    def get_total_price(self, obj):
        return obj.total_price()

class LaborSerializer(serializers.ModelSerializer):
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Labor
        fields = [
            "id",
            "invoice",
            "description",
            "hours",
            "hourly_rate",
            "total_price",
            'position',
        ]
        read_only_fields = ["id", "total_price"]

    def get_total_price(self, obj):
        return obj.total_price()

class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.__str__", read_only=True
    )
    customer_city = serializers.CharField(
        source="customer.city", read_only=True
    )
    customer_state = serializers.CharField(
        source="customer.state", read_only=True
    )    
    parts = PartSerializer(source="line_items", many=True, read_only=True)
    labor = LaborSerializer(source="labor_items", many=True, read_only=True)
    days_until_due = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "customer",
            "amount",
            "issue_date",
            "due_date",
            "paid",
            "days_until_due",
            "is_overdue",
            "parts",
            "labor",
            "customer_name",
            "customer_city",
            "customer_state",
            "tax_rate",
            "discount",
        ]
        read_only_fields = [
            "id",
            "invoice_number",
            "issue_date",
            "days_until_due",
            "is_overdue",
            "parts",
            "labor",
        ]

    def get_days_until_due(self, obj):
        return obj.days_until_due() if obj.due_date else None

    def get_is_overdue(self, obj):
        return obj.is_overdue() if obj.due_date else False

class PaymentSerializer(serializers.ModelSerializer):
    invoice = serializers.PrimaryKeyRelatedField(queryset=Invoice.objects.all())

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = []
