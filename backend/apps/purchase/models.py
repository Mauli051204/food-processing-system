from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator


class Material(models.Model):
    CSV = 'CSV'
    XLSX = 'XLSX'
    FILE_TYPE_CHOICES = [(CSV, 'CSV'), (XLSX, 'XLSX')]

    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='materials',
    )
    material_code = models.CharField(max_length=100)
    material_name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    cost = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    supplier = models.CharField(max_length=255)
    expiry_date = models.DateField()
    uploaded_file = models.FileField(upload_to='uploads/csv_xlsx/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'materials'
        verbose_name = 'Material'
        verbose_name_plural = 'Materials'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['expiry_date']),
        ]

    def __str__(self):
        return f'{self.material_name} ({self.material_code})'


class ApprovedMaterial(models.Model):
    material = models.OneToOneField(
        Material,
        on_delete=models.CASCADE,
        related_name='approved_record',
    )
    purchase_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='approved_materials',
        null=True,
    )
    edited_quantity = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    edited_cost = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    sent_to_tech = models.BooleanField(default=False)
    approved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'approved_materials'
        verbose_name = 'Approved Material'
        verbose_name_plural = 'Approved Materials'
        indexes = [
            models.Index(fields=['sent_to_tech']),
        ]

    def __str__(self):
        return f'Approved: {self.material.material_name}'


class RejectedMaterial(models.Model):
    material = models.OneToOneField(
        Material,
        on_delete=models.CASCADE,
        related_name='rejected_record',
    )
    purchase_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='rejected_materials',
        null=True,
    )
    rejection_reason = models.CharField(max_length=500, blank=True, null=True)
    rejected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rejected_materials'
        verbose_name = 'Rejected Material'
        verbose_name_plural = 'Rejected Materials'

    def __str__(self):
        return f'Rejected: {self.material.material_name}'
    
class UploadBatch(models.Model):
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='upload_batches',
    )
    original_filename = models.CharField(max_length=255)
    stored_file_path = models.CharField(max_length=500)
    uploaded_rows = models.IntegerField(default=0)
    imported_rows = models.IntegerField(default=0)
    rejected_rows = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'upload_batches'
        verbose_name = 'Upload Batch'
        verbose_name_plural = 'Upload Batches'

    def __str__(self):
        return f'{self.original_filename} ({self.vendor.email})'