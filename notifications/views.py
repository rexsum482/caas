from rest_framework import viewsets, permissions, decorators, response, authentication
from .models import Notification, Device
from .serializers import NotificationSerializer
from .pagination import NotificationPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Notification.objects.all()

        return Notification.objects.filter(
            Q(user=user) |
            Q(invoice__customer__email=user.email)
        ).distinct()
    
    @decorators.action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return response.Response({"status": "read"})

    @decorators.action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return response.Response({"status": "all read"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread": count})
    
    @action(detail=False, methods=["post"])
    def register_device(self, request):
        token = request.data.get("token")
        Device.objects.get_or_create(
            user=request.user,
            token=token
        )
        return Response({"status": "registered"})
