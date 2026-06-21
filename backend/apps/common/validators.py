"""
Shared input-validation helpers used across multiple apps for query
parameters that follow the same pattern everywhere (pagination,
date-range windows, search). Centralizing these avoids each app
reimplementing — and potentially mis-implementing — the same bounds
checks.
"""
from rest_framework.exceptions import ValidationError as DRFValidationError

MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 20

MAX_TREND_DAYS = 90
DEFAULT_TREND_DAYS = 14

MAX_SEARCH_LENGTH = 200


def get_safe_page_size(request, default=DEFAULT_PAGE_SIZE, maximum=MAX_PAGE_SIZE):
    """
    Reads ?page_size= from the request, clamped to a sane range.
    Never raises — invalid/missing values silently fall back to the
    default, since page_size is a convenience parameter, not a
    correctness-critical one. Values above the maximum are clamped
    down rather than rejected, since clamping is a better experience
    than erroring on a parameter the client probably just guessed at.
    """
    raw = request.query_params.get('page_size', default)
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return default

    if value <= 0:
        return default
    if value > maximum:
        return maximum
    return value


def get_safe_days(request, default=DEFAULT_TREND_DAYS, maximum=MAX_TREND_DAYS):
    """
    Reads ?days= from the request for trend/chart endpoints.
    Unlike page_size, an invalid days value raises a clean 400 rather
    than silently falling back — a chart silently showing the wrong
    date range is a worse failure mode than an explicit error, since
    the wrong data could be mistaken for correct data.
    """
    raw = request.query_params.get('days', default)
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise DRFValidationError({'days': 'Must be a valid integer.'})

    if value <= 0:
        raise DRFValidationError({'days': 'Must be greater than 0.'})
    if value > maximum:
        raise DRFValidationError({'days': f'Must not exceed {maximum} days.'})

    return value


def get_safe_search(request, param_name='search', max_length=MAX_SEARCH_LENGTH):
    """
    Reads a search-like query parameter, truncated to a sane maximum
    length. Truncating rather than rejecting — an overlong search
    string isn't an error from the client's perspective, it just
    doesn't need more than max_length characters to be meaningful as
    a search term.
    """
    value = request.query_params.get(param_name)
    if value is None:
        return None
    return value[:max_length]