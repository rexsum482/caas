from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",

            "first_name",
            "last_name",

            "phone_number",

            "street_address",
            "city",
            "state",
            "zip_code",

            "is_superuser",
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'ip_address': {'read_only': True},
            'is_superuser': {'read_only': True},
            'is_staff': {'read_only': True},
            'is_active': {'read_only': True},
            'last_active': {'read_only': True},
        }

    def create(self, validated_data):
        user = User(
            email=validated_data['email'].lower(),
            username=validated_data['username'].lower().replace(" ", ""),
        )
        user.set_password(validated_data['password']) 
        user.save()
        return user

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username).lower().replace(" ", "")
        if validated_data.get('email', None):
            instance.email = validated_data.get('email', instance.email.lower())
        password = validated_data.get('password', None)
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance
