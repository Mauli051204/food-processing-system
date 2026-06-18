from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
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

        if not check_password(password, user_obj.password):
            raise serializers.ValidationError({'message': 'Invalid credentials'})

        if not user_obj.is_approved and not user_obj.is_admin():
            raise serializers.ValidationError({'message': 'Your account is waiting for Admin approval.'})

        if not user_obj.is_active:
            raise serializers.ValidationError({'message': 'Account is inactive. Please contact admin.'})

        attrs['user'] = user_obj
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