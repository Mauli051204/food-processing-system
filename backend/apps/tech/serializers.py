from rest_framework import serializers
from apps.tech.models import EncryptedFile


class ReceivedBatchSerializer(serializers.Serializer):
    batch_id = serializers.CharField()
    vendor_name = serializers.CharField()
    vendor_id = serializers.IntegerField()
    material_count = serializers.IntegerField()
    upload_date = serializers.DateTimeField()
    purchase_team_member = serializers.CharField()
    status = serializers.CharField()


class EncryptedFileSerializer(serializers.ModelSerializer):
    vendor_name = serializers.SerializerMethodField()
    material_name = serializers.SerializerMethodField()
    generated_by_name = serializers.SerializerMethodField()
    has_encrypted_file = serializers.SerializerMethodField()

    class Meta:
        model = EncryptedFile
        fields = [
            'id', 'material_name', 'vendor_name', 'txt_file',
            'has_encrypted_file', 'status', 'generated_by_name', 'created_at',
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


class GenerateTxtRequestSerializer(serializers.Serializer):
    batch_id = serializers.CharField()


class EncryptBatchRequestSerializer(serializers.Serializer):
    batch_id = serializers.CharField()