import re
from django.core.exceptions import ValidationError


class ComplexPasswordValidator:
    """
    Enforces: min 8 chars, uppercase, lowercase, digit, special character.
    """
    def validate(self, password, user=None):
        errors = []
        if len(password) < 8:
            errors.append('Password must be at least 8 characters long.')
        if not re.search(r'[A-Z]', password):
            errors.append('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', password):
            errors.append('Password must contain at least one lowercase letter.')
        if not re.search(r'\d', password):
            errors.append('Password must contain at least one digit.')
        if not re.search(r'[^A-Za-z0-9]', password):
            errors.append('Password must contain at least one special character.')
        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return (
            'Your password must contain at least 8 characters, including an '
            'uppercase letter, a lowercase letter, a number, and a special character.'
        )