from django.core.exceptions import ValidationError

REJECTION_REASONS = [
    'Invalid Data',
    'Expired Material',
    'Duplicate Material',
    'Low Quality',
    'Other',
]


def validate_edit_values(quantity, cost):
    errors = []
    if quantity is not None:
        try:
            quantity = float(quantity)
            if quantity <= 0:
                errors.append('Quantity must be greater than 0.')
        except (TypeError, ValueError):
            errors.append('Quantity must be a valid number.')

    if cost is not None:
        try:
            cost = float(cost)
            if cost <= 0:
                errors.append('Cost must be greater than 0.')
        except (TypeError, ValueError):
            errors.append('Cost must be a valid number.')

    if errors:
        raise ValidationError(errors)


def validate_rejection_reason(reason):
    if not reason or not reason.strip():
        raise ValidationError('Rejection reason is required.')