from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from .models import Company


def get_subdomain(request):
    host = request.get_host().split(":")[0]  # remove port
    parts = host.split(".")

    if len(parts) > 2:
        return parts[0]

    return None


def get_default_company():
    company = cache.get("default_company")

    if not company:
        company = Company.objects.first()
        cache.set("default_company", company, 60 * 5)

    return company


class CompanyMiddleware(MiddlewareMixin):
    def process_request(self, request):
        company = None

        # 🔥 1. Try subdomain
        subdomain = get_subdomain(request)
        if subdomain:
            company = cache.get(f"company:{subdomain}")

            if not company:
                try:
                    company = Company.objects.get(subdomain=subdomain)
                    cache.set(f"company:{subdomain}", company, 60 * 5)
                except Company.DoesNotExist:
                    company = None

        # 🔐 2. Fallback to logged-in user
        if not company and request.user.is_authenticated:
            company = getattr(request.user, "company", None)

        # 🧪 3. Fallback default
        if not company:
            company = get_default_company()

        # ✅ Attach to request
        request.company = company
