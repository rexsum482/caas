"""
URL configuration for handyman project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from django.views.generic import TemplateView
from msgs.views import MessageViewSet, AttachmentViewSet
from invoices.views import InvoiceViewSet, PaymentViewSet, LaborViewSet, PartViewSet, CustomerInvoiceViewSet
from customers.views import CustomerViewSet
from appointments.views import AppointmentViewSet, public_reschedule
from notifications.views import NotificationViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("messages", MessageViewSet, basename="message")
router.register("attachments", AttachmentViewSet, basename="attachment")
router.register("invoices", InvoiceViewSet, basename="invoice")
router.register("payments", PaymentViewSet, basename="payment")
router.register("labor", LaborViewSet, basename="labor")
router.register("parts", PartViewSet, basename="part")
router.register("customer-invoices", CustomerInvoiceViewSet, basename="customer-invoice")
router.register("customers", CustomerViewSet, basename="customer")
router.register("appointments", AppointmentViewSet, basename="appointment")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path('admin/', admin.site.urls),
    path("auth/", ObtainAuthToken.as_view(), name="api_token_auth"),
    path(
        "appointments/reschedule/<uuid:token>/",
        public_reschedule,
        name="public-reschedule"
    ),
    path('api/', include(router.urls)),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='react_app'),
]
