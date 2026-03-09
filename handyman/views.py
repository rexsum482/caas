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
from django.core.cache import cache
from django.db.models import Sum, Count, Q
from datetime import timedelta, date
from django.db.models.functions import TruncMonth
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework import status
from dateutil.relativedelta import relativedelta
from calendar import monthrange

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

    def get(self, request, format=None):
        if not request.user.is_superuser:
            return Response({"detail": "Not authorized."}, status=403)

        cache_key = "admin_dashboard_v2"

        # ===============================
        # 1️⃣ CACHE FIRST (Ultra Fast Path)
        # ===============================
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        today = timezone.now().date()
        upcoming_7_day_end = today + timedelta(days=7)
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        current_month_start = today.replace(day=1)
        start_month = current_month_start - relativedelta(months=11)

        # ============================================================
        # 2️⃣ SINGLE AGGREGATE QUERY FOR ALL CORE INVOICE STATS
        # ============================================================
        invoice_stats = Invoice.objects.aggregate(
            total_revenue=Sum("amount"),
            revenue_this_month=Sum(
                "amount",
                filter=Q(issue_date__year=today.year,
                         issue_date__month=today.month)
            ),
            weekly_invoice_count=Count(
                "id",
                filter=Q(issue_date__range=[week_start, week_end])
            ),
            weekly_unpaid_count=Count(
                "id",
                filter=Q(issue_date__range=[week_start, week_end],
                         paid=False)
            ),
        )

        # ============================================================
        # 3️⃣ WEEKLY QUERYSETS (Evaluated Once)
        # ============================================================
        weekly_invoices_qs = Invoice.objects.filter(
            issue_date__range=[week_start, week_end]
        ).select_related()

        weekly_appointments_qs = Appointment.objects.filter(
            requested_date__range=[week_start, week_end],
            accepted="A"
        )

        weekly_customers_qs = Customer.objects.filter(
            created_at__range=[week_start, week_end]
        )

        weekly_reviews_qs = GoogleReview.objects.filter(
            review_time__range=[week_start, week_end]
        )

        upcoming_7_day_appointments_qs = Appointment.objects.filter(
            requested_date__gte=today,
            requested_date__lte=upcoming_7_day_end,
            accepted="A"
        )
        # ============================================================
        # 4️⃣ LAST 12 MONTHS REVENUE (Single Query + Python Fill)
        # ============================================================
        raw_revenue = (
            Invoice.objects
            .filter(issue_date__gte=start_month)
            .annotate(month=TruncMonth("issue_date"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )

        revenue_lookup = {
            item["month"].replace(day=1): item["total"] or 0
            for item in raw_revenue
        }

        revenue_last_12_months = []
        month_cursor = start_month

        for _ in range(12):
            revenue_last_12_months.append({
                "month": month_cursor.strftime("%b %Y"),
                "total": revenue_lookup.get(month_cursor, 0)
            })
            month_cursor += relativedelta(months=1)

        # ============================================================
        # 5️⃣ MONTHLY INVOICE DAILY BREAKDOWN (Full Month w/ Zero Fill)
        # ============================================================

        days_in_month = monthrange(today.year, today.month)[1]

        # No TruncDate needed if issue_date is DateField
        raw_daily = (
            Invoice.objects
            .filter(
                issue_date__year=today.year,
                issue_date__month=today.month
            )
            .values("issue_date")
            .annotate(
                count=Count("id"),
                total=Sum("amount")
            )
            .order_by("issue_date")
        )

        daily_lookup = {
            item["issue_date"]: {
                "count": item["count"] or 0,
                "total": item["total"] or 0
            }
            for item in raw_daily
        }

        monthly_invoice_chart = []

        for day_num in range(1, days_in_month + 1):
            current_day = date(today.year, today.month, day_num)

            data = daily_lookup.get(current_day, {"count": 0, "total": 0})

            monthly_invoice_chart.append({
                "issue_date": current_day,
                "count": data["count"],
                "total": data["total"]
            })

        # ============================================================
        # 6️⃣ UPCOMING APPOINTMENTS (Next 30 Days)
        # ============================================================
        upcoming_appointments_chart = list(
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

        # ============================================================
        # 7️⃣ BUILD RESPONSE (All Querysets Evaluated Once)
        # ============================================================
        response_data = {
            "week_range": {
                "start": week_start,
                "end": week_end
            },

            "counts": {
                "weekly_invoices": invoice_stats["weekly_invoice_count"] or 0,
                "unpaid_invoices": invoice_stats["weekly_unpaid_count"] or 0,
                "weekly_appointments": weekly_appointments_qs.count(),
                "weekly_customers": weekly_customers_qs.count(),
                "weekly_reviews": weekly_reviews_qs.count(),
                "appointments_next_7_days": upcoming_7_day_appointments_qs.count(),
            },

            "revenue": {
                "total_revenue": invoice_stats["total_revenue"] or 0,
                "revenue_this_month": invoice_stats["revenue_this_month"] or 0,
                "formatted_monthly_chart": monthly_invoice_chart,
                "revenue_last_12_months": revenue_last_12_months,
            },

            "charts": {
                "monthly_invoices": monthly_invoice_chart,
                "upcoming_appointments": upcoming_appointments_chart,
            },

            "weekly_data": {
                "invoices": InvoiceSerializer(weekly_invoices_qs, many=True).data,
                "appointments": AppointmentSerializer(weekly_appointments_qs, many=True).data,
                "customers": CustomerSerializer(weekly_customers_qs, many=True).data,
                "reviews": GoogleReviewSerializer(weekly_reviews_qs, many=True).data,
            },
        }

        # ============================================================
        # 8️⃣ SMART SHORT-LIVED CACHE
        # ============================================================
        cache.set(cache_key, response_data, timeout=60)

        return Response(response_data)