from rest_framework import serializers
from apps.accounts.models import User
from apps.production.models import KeyRequest, DownloadHistory
from apps.tech.models import EncryptedFile
from apps.audit.models import AuditLog
from apps.notifications.models import Notification
from .models import SystemSetting


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'role', 'is_active', 'is_approved', 'date_joined']

    def get_role(self, obj):
        return obj.role.name.lower() if obj.role else None

    def get_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip() or obj.username


class RejectUserSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class AdminKeyRequestSerializer(serializers.ModelSerializer):
    vendor_name = serializers.SerializerMethodField()
    material_name = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()

    class Meta:
        model = KeyRequest
        fields = [
            'id', 'encrypted_file', 'material_name', 'vendor_name',
            'requested_by_name', 'status', 'requested_at', 'approved_at',
        ]

    def get_vendor_name(self, obj):
        vendor = obj.encrypted_file.approved_material.material.vendor
        return f'{vendor.first_name} {vendor.last_name}'.strip() or vendor.username

    def get_material_name(self, obj):
        return obj.encrypted_file.approved_material.material.material_name

    def get_requested_by_name(self, obj):
        return f'{obj.requested_by.first_name} {obj.requested_by.last_name}'.strip() or obj.requested_by.username


class AdminEncryptedFileSerializer(serializers.ModelSerializer):
    vendor_name = serializers.SerializerMethodField()
    material_name = serializers.SerializerMethodField()
    generated_by_name = serializers.SerializerMethodField()
    has_encrypted_file = serializers.SerializerMethodField()

    class Meta:
        model = EncryptedFile
        fields = [
            'id', 'material_name', 'vendor_name', 'has_encrypted_file',
            'status', 'generated_by_name', 'created_at',
        ]

    def get_vendor_name(self, obj):
        vendor = obj.approved_material.material.vendor
        return f'{vendor.first_name} {vendor.last_name}'.strip() or vendor.username

    def get_material_name(self, obj):
        return obj.approved_material.material.material_name

    def get_generated_by_name(self, obj):
        if obj.generated_by:
            return f'{obj.generated_by.first_name} {obj.generated_by.last_name}'.strip() or obj.generated_by.username
        return None

    def get_has_encrypted_file(self, obj):
        return bool(obj.encrypted_file)


class AdminDownloadHistorySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    material_name = serializers.SerializerMethodField()

    class Meta:
        model = DownloadHistory
        fields = ['id', 'material_name', 'user_name', 'downloaded_file_path', 'downloaded_at']

    def get_user_name(self, obj):
        return f'{obj.production_user.first_name} {obj.production_user.last_name}'.strip() or obj.production_user.username

    def get_material_name(self, obj):
        return obj.encrypted_file.approved_material.material.material_name


class AdminAuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'user_email', 'role', 'action', 'description', 'ip_address', 'timestamp']

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None


class AdminNotificationSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'user_email', 'title', 'message', 'notification_type', 'is_read', 'created_at']

    def get_user_email(self, obj):
        return obj.user.email


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = [
            'application_name', 'company_name', 'max_upload_size_mb',
            'allowed_file_types', 'session_timeout_minutes', 'password_min_length', 'updated_at',
        ]
        read_only_fields = ['updated_at']


class ApproveRejectActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True)