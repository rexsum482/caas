from rest_framework import serializers
from .models import Message, Attachment

class AttachmentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(use_url=True)

    class Meta:
        model = Attachment
        fields = ['id', 'file', 'uploaded_at', 'message']
        read_only_fields = ['id', 'uploaded_at']

class MessageSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['timestamp']
