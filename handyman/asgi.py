import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "handyman.settings")

from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from notifications.middleware import TokenAuthMiddlewareStack
import notifications.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddlewareStack(
        URLRouter(notifications.routing.websocket_urlpatterns)
    ),
})
