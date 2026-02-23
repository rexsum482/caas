from appointments.serializers import AppointmentSerializer
from customers.serializers import CustomerSerializer
from invoices.serializers import InvoiceSerializer
from reviews.serializers import GoogleReviewSerializer
from invoices.models import Invoice
from appointments.models import Appointment
from customers.models import Customer
from reviews.models import GoogleReview
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication, permissions
from django.utils import timezone
from asgiref.sync import sync_to_async
from django.core.cache import cache
from django.db.models import Sum, Count, Q
from datetime import timedelta, date
from django.db.models.functions import TruncMonth
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from users.models import EmailVerificationToken
from rest_framework import status
from dateutil.relativedelta import relativedelta

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        if not user.email_confirmed:
            return Response(
                {"detail": "Email not verified."},
                status=status.HTTP_403_FORBIDDEN
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key})

class DashboardView(APIView):
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    async def get(self, request, format=None):
        user = request.user

        if not user.is_superuser:
            return Response({"detail": "Not authorized."}, status=403)

        cache_key = "admin_dashboard_v1"

        # 🔥 1. Check Cache First
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        end_month = today.replace(day=1)
        start_month = end_month - relativedelta(months=11)

        # =========================
        # INVOICE AGGREGATES (Single SQL hit)
        # =========================
        invoice_stats = await sync_to_async(
            lambda: Invoice.objects.aggregate(
                total_revenue=Sum("amount"),
                revenue_this_month=Sum(
                    "amount",
                    filter=Q(issue_date__year=today.year, issue_date__month=today.month)
                ),
                weekly_invoice_count=Count(
                    "id",
                    filter=Q(issue_date__range=[week_start, week_end])
                ),
                weekly_unpaid_count=Count(
                    "id",
                    filter=Q(issue_date__range=[week_start, week_end], paid=False)
                ),
            )
        )()

        # =========================
        # Weekly Querysets
        # =========================
        weekly_invoices = await sync_to_async(
            lambda: list(
                Invoice.objects.filter(issue_date__range=[week_start, week_end])
            )
        )()

        weekly_appointments = await sync_to_async(
            lambda: list(
                Appointment.objects.filter(
                    requested_date__range=[week_start, week_end],
                    accepted="A"
                )
            )
        )()

        weekly_customers = await sync_to_async(
            lambda: list(
                Customer.objects.filter(created_at__range=[week_start, week_end])
            )
        )()

        weekly_reviews = await sync_to_async(
            lambda: list(
                GoogleReview.objects.filter(review_time__range=[week_start, week_end])
            )
        )()

        # =========================
        # Last 12 Months Revenue
        # =========================
        raw_revenue = await sync_to_async(
            lambda: list(
                Invoice.objects
                .filter(issue_date__gte=start_month)
                .annotate(month=TruncMonth("issue_date"))
                .values("month")
                .annotate(total=Sum("amount"))
                .order_by("month")
            )
        )()

        revenue_lookup = {
            item["month"].replace(day=1): item["total"] or 0
            for item in raw_revenue
        }

        revenue_last_12_months = []
        current_month = start_month

        while current_month <= end_month:
            revenue_last_12_months.append({
                "month": current_month.strftime("%b %Y"),
                "total": revenue_lookup.get(current_month, 0)
            })
            current_month += relativedelta(months=1)

        # =========================
        # Charts
        # =========================
        monthly_invoice_chart = await sync_to_async(
            lambda: list(
                Invoice.objects
                .filter(issue_date__year=today.year, issue_date__month=today.month)
                .values("issue_date")
                .annotate(count=Count("id"), total=Sum("amount"))
                .order_by("issue_date")
            )
        )()

        upcoming_appointments_chart = await sync_to_async(
            lambda: list(
                Appointment.objects
                .filter(
                    requested_date__gte=today,
                    requested_date__lte=today + timedelta(days=30),
                    accepted="A"
                )
                .values("requested_date")
                .annotate(count=Count("id"))
                .order_by("requested_date")
            )
        )()

        # =========================
        # Build Response
        # =========================
        response_data = {
            "week_range": {"start": week_start, "end": week_end},

            "counts": {
                "weekly_invoices": invoice_stats["weekly_invoice_count"],
                "unpaid_invoices": invoice_stats["weekly_unpaid_count"],
                "weekly_appointments": len(weekly_appointments),
                "weekly_customers": len(weekly_customers),
                "weekly_reviews": len(weekly_reviews),
            },

            "revenue": {
                "total_revenue": invoice_stats["total_revenue"] or 0,
                "revenue_this_month": invoice_stats["revenue_this_month"] or 0,
                "formatted_monthly_chart": monthly_invoice_chart,
                "revenue_last_12_months": revenue_last_12_months,
            },

            "charts": {
                "monthly_invoices": monthly_invoice_chart,
                "upcoming_appointments": upcoming_appointments_chart
            },

            "weekly_data": {
                "invoices": InvoiceSerializer(weekly_invoices, many=True).data,
                "appointments": AppointmentSerializer(weekly_appointments, many=True).data,
                "customers": CustomerSerializer(weekly_customers, many=True).data,
                "reviews": GoogleReviewSerializer(weekly_reviews, many=True).data,
            },
        }

        # 🔥 2. Cache for 60 seconds
        cache.set(cache_key, response_data, timeout=60)

        return Response(response_data)