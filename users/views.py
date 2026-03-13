from rest_framework import viewsets, status
from .serializers import UserSerializer
from .models import EmailVerificationToken
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.status import HTTP_403_FORBIDDEN, HTTP_205_RESET_CONTENT, HTTP_400_BAD_REQUEST, HTTP_201_CREATED
User = get_user_model()
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.middleware.csrf import get_token
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .utils import send_verification_email

@api_view(["POST"])
@permission_classes([AllowAny])
def resend_verification_email(request):
    username = request.query_params.get("username")

    if not username:
        return Response(
            {"detail": "Username is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if user.email_confirmed:
        return Response(
            {"detail": "Email already verified."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Regenerate token & send email
    EmailVerificationToken.objects.filter(user=user).delete()
    send_verification_email(user)

    return Response(
        {"detail": "Verification email resent."},
        status=status.HTTP_200_OK,
    )

@api_view(["GET"])
def verify_email(request, token):
    verification = get_object_or_404(
        EmailVerificationToken,
        token=token
    )

    if verification.is_expired():
        verification.delete()
        return Response(
            {"detail": "Verification link expired."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = verification.user
    user.is_active = True
    user.email_confirmed = True
    user.save(update_fields=["is_active", "email_confirmed"])

    verification.delete()

    return Response(
        {"detail": "Email verified successfully."},
        status=status.HTTP_200_OK,
    )

@csrf_exempt
@require_POST
def login_view(request):
    import json
    data = json.loads(request.body.decode())
    username = data.get("username")
    password = data.get("password")

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        csrf_token = get_token(request)  # new CSRF token
        return JsonResponse({"detail": "Login successful", "csrfToken": csrf_token})
    return JsonResponse({"detail": "Invalid credentials"}, status=400)


def logout_view(request):
    logout(request)
    return JsonResponse({"detail": "Logged out"})

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import action
from rest_framework.response import Response
from django.middleware.csrf import get_token

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_authenticators(self):
        if self.request.method == "POST":
            return []
        return [TokenAuthentication()]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = UserSerializer(request.user, context={"request": request})

        response = Response(serializer.data)
        csrf_token = get_token(request)
        response["X-CSRFToken"] = csrf_token
        response["X-CSRF-Token"] = csrf_token

        return response

    @action(detail=False, methods=["post"])
    def verify(self, request):
        token = request.data.get("token")
        if Token.objects.filter(key=token).exists():
            return Response(status=200)
        return Response(status=400)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)