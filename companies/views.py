from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Company
from .serializers import CompanySerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.exceptions import ValidationError
from django.db.models import F, FloatField, ExpressionWrapper, Q
from django.db.models.functions import ACos, Cos, Sin, Radians

class CompanyViewSet(ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Company.objects.filter(memberships__user=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.owned_companies.exists():
            raise ValidationError("User already owns a company")

        company = serializer.save(owner=self.request.user)

        # 🔥 CREATE MEMBERSHIP
        from users.models import CompanyMembership

        CompanyMembership.objects.create(
            user=self.request.user,
            company=company,
            role="owner"
        )

# 🌍 PUBLIC SEARCH
class PublicCompanyViewSet(ReadOnlyModelViewSet):
    queryset = Company.objects.filter(is_active=True)
    serializer_class = CompanySerializer
    permission_classes = [AllowAny]

    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ["name", "city", "state"]
    filterset_fields = ["zip_code"]

    def get_queryset(self):
        qs = Company.objects.filter(is_active=True)

        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        radius = self.request.query_params.get("radius")  # miles
        service = self.request.query_params.get("service")

        # 🔹 FILTER BY SERVICE
        if service:
            qs = qs.filter(services__contains=[service])

        # 🔹 LOCATION FILTERING
        if lat and lng:
            try:
                lat = float(lat)
                lng = float(lng)

                qs = qs.exclude(
                    Q(latitude__isnull=True) | Q(longitude__isnull=True)
                )

                qs = qs.annotate(
                    distance=ExpressionWrapper(
                        3959 * ACos(
                            Cos(Radians(lat)) *
                            Cos(Radians(F("latitude"))) *
                            Cos(Radians(F("longitude")) - Radians(lng)) +
                            Sin(Radians(lat)) *
                            Sin(Radians(F("latitude")))
                        ),
                        output_field=FloatField()
                    )
                )

                # 🔥 APPLY RADIUS FILTER
                if radius:
                    radius = float(radius)
                    qs = qs.filter(distance__lte=radius)

                qs = qs.order_by("distance")

            except ValueError:
                pass

        return qs
