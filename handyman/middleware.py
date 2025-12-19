# users/middleware.py
from django.utils import timezone

class UpdateLastActiveMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        user = getattr(request, "user", None)

        if user and user.is_authenticated:
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

            if x_forwarded_for:
                ip = x_forwarded_for.split(",")[0].strip()
            else:
                ip = request.META.get("REMOTE_ADDR")

            now_str = timezone.now().isoformat()
            updates = {}

            if user.last_active != now_str:
                updates["last_active"] = now_str

            if user.ip_address != ip:
                updates["ip_address"] = ip

            if updates:
                for key, val in updates.items():
                    setattr(user, key, val)
                user.save(update_fields=list(updates.keys()))

        return response
