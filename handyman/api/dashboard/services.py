from django.utils import timezone
from dateutil.relativedelta import relativedelta
from datetime import timedelta
from calendar import monthrange
from . import selectors


class DashboardService:

    @staticmethod
    def build_dashboard():

        today = timezone.now().date()
        start_month = today.replace(day=1) - relativedelta(months=11)

        invoice_stats = selectors.invoice_kpis(today)

        weekly_counts = selectors.weekly_counts(today)

        revenue_raw = selectors.revenue_last_12_months(start_month)

        upcoming = selectors.upcoming_appointments(today)

        revenue_lookup = {
            item["month"].replace(day=1): item["total"] or 0
            for item in revenue_raw
        }

        revenue_last_12_months = []

        month_cursor = start_month

        for _ in range(12):
            revenue_last_12_months.append({
                "month": month_cursor.strftime("%b %Y"),
                "total": revenue_lookup.get(month_cursor, 0)
            })
            month_cursor += relativedelta(months=1)

        return {
            "counts": {
                "weekly_invoices": invoice_stats["weekly_invoice_count"] or 0,
                "unpaid_invoices": invoice_stats["weekly_unpaid_count"] or 0,
                "weekly_appointments": weekly_counts["appointments"],
                "weekly_customers": weekly_counts["customers"],
                "weekly_reviews": weekly_counts["reviews"],
            },

            "revenue": {
                "total_revenue": invoice_stats["total_revenue"] or 0,
                "revenue_this_month": invoice_stats["revenue_this_month"] or 0,
                "revenue_last_12_months": revenue_last_12_months,
            },

            "charts": {
                "upcoming_appointments": list(upcoming)
            }
        }
