from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet, verify_email, resend_verification_email
from django.views.generic import TemplateView
from msgs.views import MessageViewSet, AttachmentViewSet
from invoices.views import InvoiceViewSet, PaymentViewSet, LaborViewSet, PartViewSet, CustomerInvoiceViewSet
from customers.views import (
    CustomerViewSet,
    ShippingAddressViewSet,
    BillingAddressViewSet
)
from appointments.views import AppointmentViewSet, public_reschedule
from notifications.views import NotificationViewSet
from reviews.views import GoogleReviewViewSet, ReviewStatsView
from .views import DashboardView, CustomAuthToken
from products.views import ProductViewSet, ProductImageViewSet
from orders.views import CheckoutView, OrderViewSet
from orders.webhooks import square_webhook
from carts.views import CartViewSet
from rest_framework_nested.routers import NestedDefaultRouter

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("messages", MessageViewSet, basename="message")
router.register("attachments", AttachmentViewSet, basename="attachment")
router.register("cart", CartViewSet, basename="cart")
router.register("products", ProductViewSet, basename="product")
router.register("invoices", InvoiceViewSet, basename="invoice")
router.register("payments", PaymentViewSet, basename="payment")
router.register("labor", LaborViewSet, basename="labor")
router.register("parts", PartViewSet, basename="part")
router.register("customer-invoices", CustomerInvoiceViewSet, basename="customer-invoice")
router.register("customers", CustomerViewSet, basename="customer")
router.register("appointments", AppointmentViewSet, basename="appointment")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("reviews", GoogleReviewViewSet, basename="review")
router.register("shipping-addresses", ShippingAddressViewSet, basename="shipping-address")
router.register("billing-addresses", BillingAddressViewSet, basename="billing-address")
router.register("orders", OrderViewSet, basename="order")

products_router = NestedDefaultRouter(router, r'products', lookup='product')
products_router.register(r'images', ProductImageViewSet, basename='product-images')

urlpatterns = [
    path('admin/', admin.site.urls),
    path("auth/", CustomAuthToken.as_view(), name="api_token_auth"),
    path(
        "appointments/reschedule/<uuid:token>/",
        public_reschedule,
        name="public-reschedule"
    ),
    path(
        "api/users/verify-email/<uuid:token>/",
        verify_email,
        name="verify-email"
    ),
    path(
        "api/users/resend-verification/",
        resend_verification_email,
        name="resend-verification"
    ),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/reviews/stats/", ReviewStatsView.as_view(), name="review-stats"),
    path("webhooks/square/", square_webhook),
    path("api/checkout/", CheckoutView.as_view(), name="checkout"),
    path('api/', include(router.urls)),
    path('api/', include(products_router.urls)),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='react_app'),
]
