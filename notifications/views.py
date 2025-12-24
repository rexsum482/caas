from rest_framework import viewsets, permissions
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only notifications:
    - GET /api/notifications/
    - GET /api/notifications/<id>/
    """
    queryset = Notification.objects.all().order_by("-created_at")
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
