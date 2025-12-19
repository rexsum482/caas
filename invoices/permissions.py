from rest_framework.permissions import BasePermission

class IsInvoiceOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.customer.email == request.user.email
