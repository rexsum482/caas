from rest_framework import serializers
from .models import Appointment
from django.utils import timezone
from datetime import datetime, timedelta


class AppointmentSerializer(serializers.ModelSerializer):
    customer_full_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source="get_accepted_display", read_only=True
    )
    start = serializers.SerializerMethodField()
    end = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",

            # Customer info
            "customer_first_name",
            "customer_last_name",
            "customer_full_name",
            "customer_email",
            "customer_phone_number",
            "customer_street_address",
            "customer_apt_suite",
            "customer_city",
            "customer_state",
            "customer_zip_code",

            # Appointment info
            "requested_date",
            "requested_time",
            "description",
            "accepted",
            "status_display",
            "start",
            "end",
        ]
        read_only_fields = ["id"]

    def get_customer_full_name(self, obj):
        return f"{obj.customer_first_name} {obj.customer_last_name}"

    def get_start(self, obj):
        dt = datetime.combine(obj.requested_date, obj.requested_time)
        aware_dt = timezone.make_aware(
            dt,
            timezone.get_current_timezone()
        )
        return timezone.localtime(aware_dt).isoformat()


    def get_end(self, obj):
        dt = datetime.combine(obj.requested_date, obj.requested_time) + timedelta(hours=1)
        aware_dt = timezone.make_aware(
            dt,
            timezone.get_current_timezone()
        )
        return timezone.localtime(aware_dt).isoformat()

class PublicAppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "customer_first_name",
            "requested_date",
            "requested_time",
            "description",
        ]