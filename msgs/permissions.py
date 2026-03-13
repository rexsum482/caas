from rest_framework.permissions import BasePermission

class AdminReadCustomerWrite(BasePermission):
    """
    Admin: full access
    Customers: can only POST(create)
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_superuser:
            return True
        
        # Customer allowed only to submit message
        return view.action in ['create']
