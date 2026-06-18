from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    message = 'Only Admin users can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name == 'ADMIN'
        )


class IsVendor(BasePermission):
    message = 'Only Vendor users can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name == 'VENDOR'
        )


class IsPurchaseTeam(BasePermission):
    message = 'Only Purchase Team users can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name == 'PURCHASE'
        )


class IsTechTeam(BasePermission):
    message = 'Only Tech Team users can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name == 'TECH'
        )


class IsProductionTeam(BasePermission):
    message = 'Only Production Team users can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            and request.user.role.name == 'PRODUCTION'
        )


class IsApprovedUser(BasePermission):
    message = 'Your account is pending approval.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_approved
        )