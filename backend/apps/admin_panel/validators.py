from django.core.exceptions import ValidationError
from apps.accounts.models import User


def validate_user_pending_approval(user):
    if user.status == User.APPROVED:
        raise ValidationError('This user has already been approved.')


def validate_user_not_admin(user):
    if user.role and user.role.name == 'ADMIN':
        raise ValidationError('Admin users cannot be modified through this action.')


def validate_settings_values(data):
    errors = []
    if 'max_upload_size_mb' in data and data['max_upload_size_mb'] <= 0:
        errors.append('Maximum upload size must be greater than 0.')
    if 'session_timeout_minutes' in data and data['session_timeout_minutes'] <= 0:
        errors.append('Session timeout must be greater than 0.')
    if 'password_min_length' in data and data['password_min_length'] < 8:
        errors.append('Password minimum length cannot be less than 8.')
    if errors:
        raise ValidationError(errors)