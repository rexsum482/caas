from django.urls import re_path
from .consumers import UserEventConsumer

websocket_urlpatterns = [
    re_path(r"^ws/notifications/(?P<group>[^/]+)/?$", UserEventConsumer.as_asgi()),

]
