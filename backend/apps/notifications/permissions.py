from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Object-level permission: a notification can only be acted on by the
    user it belongs to. This is the enforcement point for the spec's
    'Users must never access another user's notifications' rule.
    """
    message = 'You do not have permission to access this notification.'

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id