from rest_framework.permissions import BasePermission


class IsProductionTeam(BasePermission):
    message = 'Only Production Team users can access this resource.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role
            and user.role.name == 'PRODUCTION'
        )