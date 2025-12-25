from django.utils import timezone
from django.http import HttpRequest

class UpdateLastActiveMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 🚫 HARD STOP for WebSockets / ASGI scopes
        if not isinstance(request, HttpRequest):
            return self.get_response(request)

        response = self.get_response(request)

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return response

        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        ip = (
            x_forwarded_for.split(",")[0].strip()
            if x_forwarded_for
            else request.META.get("REMOTE_ADDR")
        )

        now = timezone.now()
        updates = {}

        if user.last_active != now:
            updates["last_active"] = now

        if user.ip_address != ip:
            updates["ip_address"] = ip

        if updates:
            for key, val in updates.items():
                setattr(user, key, val)
            user.save(update_fields=updates.keys())

        return response
