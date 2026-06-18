from rest_framework import serializers
from apps.tech.models import EncryptedFile
from apps.production.models import KeyRequest, DownloadHistory


class EncryptedFileAvailableSerializer(serializers.ModelSerializer):
    vendor_name = serializers.SerializerMethodField()
    material_name = serializers.SerializerMethodField()
    purchase_date = serializers.SerializerMethodField()

    class Meta:
        model = EncryptedFile
        fields = ['id', 'material_name', 'vendor_name', 'purchase_date', 'status', 'created_at']

    def get_vendor_name(self, obj):
        vendor = obj.approved_material.material.vendor
        return f'{vendor.first_name} {vendor.last_name}'.strip() or vendor.username

    def get_material_name(self, obj):
        return obj.approved_material.material.material_name

    def get_purchase_date(self, obj):
        return obj.approved_material.approved_at


class KeyRequestSerializer(serializers.ModelSerializer):
    vendor_name = serializers.SerializerMethodField()
    material_name = serializers.SerializerMethodField()

    class Meta:
        model = KeyRequest
        fields = [
            'id', 'encrypted_file', 'material_name', 'vendor_name',
            'status', 'requested_at', 'approved_at',
        ]

    def get_vendor_name(self, obj):
        vendor = obj.encrypted_file.approved_material.material.vendor
        return f'{vendor.first_name} {vendor.last_name}'.strip() or vendor.username

    def get_material_name(self, obj):
        return obj.encrypted_file.approved_material.material.material_name


class DownloadHistorySerializer(serializers.ModelSerializer):
    vendor_name = serializers.SerializerMethodField()
    material_name = serializers.SerializerMethodField()
    production_user_name = serializers.SerializerMethodField()

    class Meta:
        model = DownloadHistory
        fields = [
            'id', 'material_name', 'vendor_name', 'production_user_name',
            'downloaded_file_path', 'downloaded_at',
        ]

    def get_vendor_name(self, obj):
        vendor = obj.encrypted_file.approved_material.material.vendor
        return f'{vendor.first_name} {vendor.last_name}'.strip() or vendor.username

    def get_material_name(self, obj):
        return obj.encrypted_file.approved_material.material.material_name

    def get_production_user_name(self, obj):
        return f'{obj.production_user.first_name} {obj.production_user.last_name}'.strip() or obj.production_user.username


class ProductionHistorySerializer(serializers.Serializer):
    batch_id = serializers.IntegerField()
    vendor_name = serializers.CharField()
    request_date = serializers.DateTimeField()
    approval_date = serializers.DateTimeField(allow_null=True)
    download_date = serializers.DateTimeField(allow_null=True)
    status = serializers.CharField()


class ApproveRejectKeyRequestSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])