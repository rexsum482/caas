from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication

from .services import DashboardService
from .serializers import DashboardSerializer
from .permissions import IsAdminDashboard
from .cache import get_dashboard_cache, set_dashboard_cache


class AdminDashboardView(APIView):

    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [IsAdminDashboard]

    def get(self, request):

        cached = get_dashboard_cache()

        if cached:
            return Response(cached)

        data = DashboardService.build_dashboard()

        serializer = DashboardSerializer(data)

        set_dashboard_cache(serializer.data)

        return Response(serializer.data)
