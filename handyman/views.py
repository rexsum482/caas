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
from django.db.models import Sum, Count, F
from datetime import timedelta, date
from django.db.models.functions import TruncMonth
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from users.models import EmailVerificationToken
from rest_framework import status

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
        user = request.user

        if not user.is_superuser:
            return Response({"detail": "Not authorized."}, status=403)

        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        invoices = Invoice.objects.filter(issue_date__range=[week_start, week_end])
        appointments = Appointment.objects.filter(requested_date__range=[week_start, week_end], accepted="A")
        customers = Customer.objects.filter(created_at__range=[week_start, week_end])
        reviews = GoogleReview.objects.filter(review_time__range=[week_start, week_end])

        total_revenue = Invoice.objects.aggregate(total=Sum("amount"))["total"] or 0
        revenue_this_month = Invoice.objects.filter(
            issue_date__year=today.year, issue_date__month=today.month
        ).aggregate(total=Sum("amount"))["total"] or 0

        monthly_invoice_chart = (
            Invoice.objects.filter(issue_date__year=today.year, issue_date__month=today.month)
            .values("issue_date")
            .annotate(count=Count("id"), total=Sum("amount"))
            .order_by("issue_date")
        )

        revenue_last_12_months = (
            Invoice.objects.filter(issue_date__gte=today.replace(year=today.year-1))
            .annotate(month=TruncMonth("issue_date"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )

        upcoming_appointments_chart = (
            Appointment.objects.filter(requested_date__gte=today, requested_date__lte=today + timedelta(days=30), accepted="A")
            .values("requested_date")
            .annotate(count=Count("id"))
            .order_by("requested_date")
        )

        response = {
            "week_range": {"start": week_start, "end": week_end},

            "counts": {
                "weekly_invoices": invoices.count(),
                "unpaid_invoices": invoices.filter(paid=False).count(),
                "weekly_appointments": appointments.count(),
                "weekly_customers": customers.count(),
                "weekly_reviews": reviews.count(),
            },

            "revenue": {
                "total_revenue": total_revenue,
                "revenue_this_month": revenue_this_month,
                "formatted_monthly_chart": list(monthly_invoice_chart),
                "revenue_last_12_months": list(revenue_last_12_months),
            },

            "charts": {
                "monthly_invoices": list(monthly_invoice_chart),           # e.g. [{date, count, total}]
                "upcoming_appointments": list(upcoming_appointments_chart) # count by day
            },

            "weekly_data": {
                "invoices": InvoiceSerializer(invoices, many=True).data,
                "appointments": AppointmentSerializer(appointments, many=True).data,
                "customers": CustomerSerializer(customers, many=True).data,
                "reviews": GoogleReviewSerializer(reviews, many=True).data,
            },
        }

        return Response(response)