from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.accounts.models import User
from apps.vendors.validators import validate_password_strength, validate_phone_number, validate_full_name as _validate_full_name


class StaffRegisterSerializer(serializers.Serializer):
    """
    Shared registration serializer for Purchase, Tech, and Production.
    The target role is set by the view (not the client), so a person
    can't register as e.g. Tech via the Purchase registration endpoint.
    """
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_full_name(self, value):
        try:
            return _validate_full_name(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)[0] if hasattr(exc, 'messages') else str(exc))

    def validate_phone(self, value):
        try:
            cleaned = validate_phone_number(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)[0] if hasattr(exc, 'messages') else str(exc))

        if User.objects.filter(phone=cleaned).exists():
            raise serializers.ValidationError('A user with this phone number already exists.')
        return cleaned

    def validate_password(self, value):
        try:
            validate_password_strength(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs