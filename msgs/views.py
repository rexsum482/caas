from rest_framework import viewsets
from .models import Message
from .serializers import MessageSerializer
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, permissions, parsers
from .models import Attachment, Message
from .serializers import AttachmentSerializer


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [TokenAuthentication]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        message_id = self.request.data.get("message")

        if not message_id:
            raise ValueError("Message ID is required for attachments")

        message = Message.objects.get(id=message_id)
        serializer.save(message=message)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.AllowAny]
