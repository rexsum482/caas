from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only=True)

    # 🔹 allowed values
    SERVICE_CHOICES = [
        "plumbing",
        "hvac",
        "electrical",
        "roofing",
        "appliance",
        "general",
        "landscaping",
        "cleaning",
    ]

    # 🔹 display labels
    SERVICE_MAP = {
        "plumbing": "Plumbing",
        "hvac": "HVAC",
        "electrical": "Electrical",
        "roofing": "Roofing",
        "appliance": "Appliance Repair",
        "general": "General Handyman",
        "landscaping": "Landscaping",
        "cleaning": "Cleaning",
    }

    # 🔥 expose readable labels in API
    services_display = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = "__all__"
        read_only_fields = ["id", "subdomain", "owner", "created_at", "updated_at"]

    # 🔹 validation
    def validate_services(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Services must be a list.")

        invalid = [v for v in value if v not in self.SERVICE_CHOICES]

        if invalid:
            raise serializers.ValidationError(
                f"Invalid services: {invalid}"
            )

        return value

    # 🔥 API output
    def get_services_display(self, obj):
        return [
            self.SERVICE_MAP.get(s, s)
            for s in (obj.services or [])
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["service_choices"] = self.SERVICE_MAP
        return data
