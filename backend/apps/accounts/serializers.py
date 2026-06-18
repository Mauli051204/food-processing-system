from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Role


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password')

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'message': 'Invalid credentials'})

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError({'message': 'Invalid credentials'})

        if not user.is_active:
            raise serializers.ValidationError({'message': 'Account is inactive. Please contact admin.'})

        if not user.is_approved and not user.is_admin():
            raise serializers.ValidationError({'message': 'Account is pending admin approval.'})

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'role', 'is_approved', 'is_active']

    def get_role(self, obj):
        return obj.role.name.lower() if obj.role else None

    def get_name(self, obj):
        full_name = f'{obj.first_name} {obj.last_name}'.strip()
        return full_name or obj.username


class VendorRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    name = serializers.CharField(write_only=True)
    company_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'phone', 'company_name']

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def create(self, validated_data):
        from apps.vendors.models import VendorProfile

        name = validated_data.pop('name')
        company_name = validated_data.pop('company_name')
        password = validated_data.pop('password')

        name_parts = name.strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        vendor_role = Role.objects.get(name='VENDOR')

        user = User(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=first_name,
            last_name=last_name,
            phone=validated_data.get('phone', ''),
            role=vendor_role,
            is_active=False,
            is_approved=False,
        )
        user.set_password(password)
        user.save()

        VendorProfile.objects.create(
            user=user,
            company_name=company_name,
            address=None,
        )
        return user