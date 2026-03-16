from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from invoices.models import Invoice
from appointments.models import Appointment
from customers.models import Customer
from reviews.models import GoogleReview

def invoice_kpis(today):
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    return Invoice.objects.aggregate(
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
            filter=Q(issue_date__range=[week_start, week_end], paid=False)
        ),
    )


def weekly_counts(today):
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    return {
        "appointments": Appointment.objects.filter(
            requested_date__range=[week_start, week_end],
            accepted="A"
        ).count(),

        "customers": Customer.objects.filter(
            created_at__range=[week_start, week_end]
        ).count(),

        "reviews": GoogleReview.objects.filter(
            review_time__range=[week_start, week_end]
        ).count(),
    }


def revenue_last_12_months(start_month):
    return (
        Invoice.objects
        .filter(issue_date__gte=start_month)
        .annotate(month=TruncMonth("issue_date"))
        .values("month")
        .annotate(total=Sum("amount"))
        .order_by("month")
    )


def upcoming_appointments(today, days=30):
    return (
        Appointment.objects
        .filter(
            requested_date__gte=today,
            requested_date__lte=today + timedelta(days=days),
            accepted="A"
        )
        .values("requested_date")
        .annotate(count=Count("id"))
        .order_by("requested_date")
    )
