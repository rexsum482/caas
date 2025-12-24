from rest_framework.permissions import BasePermission


class IsAdminOrReadCreateOnly(BasePermission):
    """
    - Anyone can CREATE appointments
    - Anyone can READ appointments
    - Only admins can UPDATE / ACCEPT / DECLINE
    """

    def has_permission(self, request, view):
        if request.method in ["GET", "POST"]:
            return True
        return request.user and request.user.is_staff
