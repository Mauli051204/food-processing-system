from rest_framework import serializers
from .models import Material, ApprovedMaterial, RejectedMaterial


class VendorRequestListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    vendor_name = serializers.CharField()
    company = serializers.CharField()
    upload_date = serializers.DateTimeField()
    status = serializers.CharField()


class VendorDetailSerializer(serializers.Serializer):
    vendor_id = serializers.IntegerField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    company_name = serializers.CharField()
    address = serializers.CharField(allow_null=True)
    total_materials = serializers.IntegerField()
    imported_rows = serializers.IntegerField()
    rejected_rows = serializers.IntegerField()
    upload_history = serializers.ListField()


class MaterialReviewSerializer(serializers.ModelSerializer):
    vendor_name = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = [
            'id', 'material_code', 'material_name', 'quantity', 'cost',
            'supplier', 'expiry_date', 'status', 'vendor_name', 'created_at',
        ]

    def get_vendor_name(self, obj):
        return f'{obj.vendor.first_name} {obj.vendor.last_name}'.strip() or obj.vendor.username


class EditMaterialSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    def validate(self, attrs):
        if 'quantity' not in attrs and 'cost' not in attrs:
            raise serializers.ValidationError('At least one of quantity or cost must be provided.')
        if 'quantity' in attrs and attrs['quantity'] <= 0:
            raise serializers.ValidationError({'quantity': 'Quantity must be greater than 0.'})
        if 'cost' in attrs and attrs['cost'] <= 0:
            raise serializers.ValidationError({'cost': 'Cost must be greater than 0.'})
        return attrs


class ApproveMaterialSerializer(serializers.Serializer):
    edited_quantity = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    edited_cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    remarks = serializers.CharField(required=False, allow_blank=True)


class RejectMaterialSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=False)

    def validate_reason(self, value):
        if not value.strip():
            raise serializers.ValidationError('Rejection reason is required.')
        return value


class ApprovedMaterialSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.material_name')
    material_code = serializers.CharField(source='material.material_code')
    purchase_user_name = serializers.SerializerMethodField()

    class Meta:
        model = ApprovedMaterial
        fields = [
            'id', 'material_code', 'material_name', 'edited_quantity', 'edited_cost',
            'sent_to_tech', 'approved_at', 'purchase_user_name',
        ]

    def get_purchase_user_name(self, obj):
        if obj.purchase_user:
            return f'{obj.purchase_user.first_name} {obj.purchase_user.last_name}'.strip() or obj.purchase_user.username
        return None


class RejectedMaterialSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.material_name')
    material_code = serializers.CharField(source='material.material_code')
    purchase_user_name = serializers.SerializerMethodField()

    class Meta:
        model = RejectedMaterial
        fields = [
            'id', 'material_code', 'material_name', 'rejection_reason',
            'rejected_at', 'purchase_user_name',
        ]

    def get_purchase_user_name(self, obj):
        if obj.purchase_user:
            return f'{obj.purchase_user.first_name} {obj.purchase_user.last_name}'.strip() or obj.purchase_user.username
        return None


class SendToTechSerializer(serializers.Serializer):
    approved_material_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
    )