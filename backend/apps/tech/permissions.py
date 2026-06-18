from rest_framework.permissions import BasePermission


class IsTechTeam(BasePermission):
    message = 'Only Tech Team users can access this resource.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role
            and user.role.name == 'TECH'
        )