from rest_framework.permissions import BasePermission


class IsApprovedVendor(BasePermission):
    """
    Restricts access to authenticated users with the VENDOR role
    who have also been approved by an admin.
    """
    message = 'Only approved vendors can access this resource.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if not (user.role and user.role.name == 'VENDOR'):
            return False
        return user.is_approved