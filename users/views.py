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

@api_view(["GET"])
def verify_email(request, token):
    try:
        verification = EmailVerificationToken.objects.get(token=token)
        user = verification.user
        user.is_active = True
        user.email_confirmed = True
        user.save()
        verification.delete()  # optional: remove used token
        return Response({"detail": "Email verified successfully."}, status=status.HTTP_200_OK)
    except:
        return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

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

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=['get'])
    def me(self, request):

        user = request.user
        serializer = UserSerializer(user, context={'request': request})

        response_data = serializer.data

        csrf_token = get_token(request)

        response = Response(response_data)
        response["X-CSRFToken"] = csrf_token
        response["X-CSRF-Token"] = csrf_token

        return response
    
    @action(detail=False, methods=['post'])
    def verify(self, request):
        token = request.data.get('token')
        tokens = Token.objects.filter(key=token)
        if len(tokens) > 0:
            return Response(data={}, status=200)
        return Response(data={}, status=400)


    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)
