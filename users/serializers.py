from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    is_company_owner = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",

            "first_name",
            "last_name",

            "phone_number",

            "street_address",
            "city",
            "state",
            "zip_code",

            "is_superuser",
            "company",
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'company': {'read_only': True},
            'ip_address': {'read_only': True},
            'is_superuser': {'read_only': True},
            'is_staff': {'read_only': True},
            'is_active': {'read_only': True},
            'last_active': {'read_only': True},
        }

    def get_is_company_owner(self, obj):
        return obj.owned_companies.exists()

    def create(self, validated_data):
        password = validated_data.pop("password")

        request = self.context.get("request")
        company = getattr(request, "company", None)

        user = User(**validated_data)

        if company:
            user.company = company  # 🔥 auto-assign from subdomain

        user.set_password(password)
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
