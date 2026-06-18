import logging

logger = logging.getLogger('role_access')


class AuditLogMiddleware:
    """
    Logs every authenticated request with the user's role,
    and flags permission-denied responses (403) as unauthorized access attempts.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            role_name = user.role.name if user.role else 'NO_ROLE'
            if response.status_code == 403:
                logger.warning(
                    'UNAUTHORIZED ACCESS ATTEMPT: user=%s role=%s path=%s method=%s ip=%s',
                    user.email, role_name, request.path, request.method, self._get_ip(request),
                )
            else:
                logger.info(
                    'ACCESS: user=%s role=%s path=%s method=%s status=%s',
                    user.email, role_name, request.path, request.method, response.status_code,
                )

        return response

    @staticmethod
    def _get_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')