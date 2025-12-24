from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    time_since = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "content",
            "created_at",
            "time_since",
        ]
        read_only_fields = ["id", "created_at", "time_since"]

    def get_time_since(self, obj):
        return obj.time_since()
