# msgs/views.py
from rest_framework import viewsets, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from .models import Message, Attachment
from .serializers import MessageSerializer, AttachmentSerializer
from .permissions import AdminReadCustomerWrite

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all().order_by('-timestamp')
    serializer_class = MessageSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [AdminReadCustomerWrite]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Message.objects.all().order_by('-timestamp')
        return Message.objects.none()  # customers blocked from viewing

    def perform_create(self, serializer):
        serializer.save()

    # 🔥 mark-as-read endpoint
    @action(methods=['patch'], detail=True, url_path='mark-read')
    def mark_read(self, request, pk=None):
        if not request.user.is_superuser:
            return Response({"detail": "Admins only"}, status=403)

        msg = self.get_object()
        msg.read = True
        msg.save()
        return Response({"status": "marked as read"})

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [AdminReadCustomerWrite]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        return Attachment.objects.all() if self.request.user.is_superuser else Attachment.objects.none()

    def perform_create(self, serializer):
        message_id = self.request.data.get("message")
        serializer.save(message_id=message_id)
