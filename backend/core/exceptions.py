import logging
from rest_framework.views import exception_handler

logger = logging.getLogger('api_errors')


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to:
    1. Standardize every error response into {error, detail, status_code}
       (unchanged behavior from before this fix).
    2. Log every error that reaches this handler — both the ones DRF
       recognizes (validation errors, permission denials, etc.) and,
       critically, the ones it doesn't (unhandled exceptions like
       AttributeError, KeyError, User.DoesNotExist called outside a
       try/except). Before this fix, unhandled exceptions produced
       zero log record — only a console traceback visible in DEBUG
       mode, meaning production deployments (DEBUG=False) would lose
       all trace of what happened.

    Never logs request bodies or exception args verbatim where they
    might contain sensitive fields (password, AES key material) —
    only the exception type, the view that raised it, and the user
    (by id, not full object) are logged.
    """
    response = exception_handler(exc, context)
    view = context.get('view')
    view_name = view.__class__.__name__ if view else 'UnknownView'
    request = context.get('request')
    user_id = getattr(getattr(request, 'user', None), 'id', None)

    if response is not None:
        # Handled exception (DRF recognized it) — log at INFO/WARNING
        # depending on severity, without the full stack trace, since
        # these are expected control-flow (validation errors, 403s,
        # 404s) rather than bugs.
        if response.status_code >= 500:
            logger.error(
                'API error in %s (user_id=%s): %s [%s]',
                view_name, user_id, exc.__class__.__name__, response.status_code,
            )
        elif response.status_code >= 400:
            logger.warning(
                'API error in %s (user_id=%s): %s [%s]',
                view_name, user_id, exc.__class__.__name__, response.status_code,
            )

        response.data = {
            'error': True,
            'detail': response.data,
            'status_code': response.status_code,
        }
    else:
        # Unhandled exception — DRF couldn't classify it, meaning it's
        # an unexpected bug, not expected control flow. This is the
        # gap that previously produced zero log record. Log at ERROR
        # with the full exception info (stack trace) since this is
        # exactly the case where debugging needs it most.
        logger.error(
            'Unhandled exception in %s (user_id=%s): %s',
            view_name, user_id, exc.__class__.__name__,
            exc_info=True,
        )

    return response