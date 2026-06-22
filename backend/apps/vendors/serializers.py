from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.accounts.models import User, Role
from .models import VendorProfile
from .validators import validate_password_strength, validate_phone_number, validate_full_name
from apps.purchase.models import Material


class VendorRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    company_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_full_name(self, value):
        try:
            return validate_full_name(value)
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

    def create(self, validated_data):
        name_parts = validated_data['full_name'].strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        vendor_role = Role.objects.get(name='VENDOR')

        user = User(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=first_name,
            last_name=last_name,
            phone=validated_data['phone'],
            role=vendor_role,
            is_active=False,
            is_approved=False,
        )
        user.set_password(validated_data['password'])
        user.save()

        VendorProfile.objects.create(
            user=user,
            company_name=validated_data['company_name'],
        )

        return user


class VendorProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    phone = serializers.CharField(source='user.phone', read_only=True)
    is_approved = serializers.BooleanField(source='user.is_approved', read_only=True)

    class Meta:
        model = VendorProfile
        fields = ['id', 'full_name', 'email', 'phone', 'company_name', 'address', 'is_approved']

    def get_full_name(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip()


class VendorProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorProfile
        fields = ['company_name', 'address']


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = [
            'id', 'material_code', 'material_name', 'quantity', 'cost',
            'supplier', 'expiry_date', 'file_type', 'status', 'created_at',
        ]


class UploadHistorySerializer(serializers.Serializer):
    file_name = serializers.CharField()
    uploaded_at = serializers.DateTimeField()
    rows_imported = serializers.IntegerField()
    rows_rejected = serializers.IntegerField()
    status = serializers.CharField()


class SendToPurchaseSerializer(serializers.Serializer):
    material_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
    )