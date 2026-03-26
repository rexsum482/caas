from django.middleware.csrf import get_token

def frontend_context(request):
    company = getattr(request, "company", None)

    return {
        "company_name": getattr(company, "name", ""),
        "short_name": getattr(company, "short_name", ""),
        "admin_email": getattr(company, "admin_email", ""),
        "primary_color": getattr(company, "primary_color", "#2f80ed"),
        "accent_color": getattr(company, "accent_color", "#215199ff"),
        "alert_color": getattr(company, "alert_color", "#dc2626"),
        "warning_color": getattr(company, "warning_color", "#f59e0b"),
        "success_color": getattr(company, "success_color", "#22c55e"),
        "business_hours": getattr(company, "business_hours", {}) or {},
        "csrf_token": get_token(request),
    }
