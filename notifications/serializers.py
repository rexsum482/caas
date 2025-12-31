from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    time_since = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "invoice",
            'email',
            "title",
            "content",
            "is_read",
            "created_at",
            "time_since",
            'type',
            "metadata",
        ]

    def get_time_since(self, obj):
        return obj.time_since()

    def get_email(self, obj):
        if obj.invoice and obj.invoice.customer:
            return obj.invoice.customer.email 
        elif obj.user:
            return obj.user.email
        return None 