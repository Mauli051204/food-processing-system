from django.conf import settings
from django.db import models
from apps.purchase.models import ApprovedMaterial


class EncryptedFile(models.Model):
    PENDING = 'PENDING'
    TXT_GENERATED = 'TXT_GENERATED'
    ENCRYPTED = 'ENCRYPTED'
    KEY_REQUESTED = 'KEY_REQUESTED'
    KEY_APPROVED = 'KEY_APPROVED'
    DECRYPTED = 'DECRYPTED'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (TXT_GENERATED, 'TXT Generated'),
        (ENCRYPTED, 'Encrypted'),
        (KEY_REQUESTED, 'Key Requested'),
        (KEY_APPROVED, 'Key Approved'),
        (DECRYPTED, 'Decrypted'),
    ]

    approved_material = models.OneToOneField(
        ApprovedMaterial,
        on_delete=models.CASCADE,
        related_name='encrypted_file',
    )
    original_file = models.FileField(upload_to='uploads/original/')
    txt_file = models.FileField(upload_to='uploads/txt/')
    encrypted_file = models.FileField(upload_to='uploads/encrypted/')
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='generated_encrypted_files',
        null=True,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'encrypted_files'
        verbose_name = 'Encrypted File'
        verbose_name_plural = 'Encrypted Files'
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'EncryptedFile #{self.id} - {self.status}'


class AESKey(models.Model):
    encrypted_file = models.OneToOneField(
        EncryptedFile,
        on_delete=models.CASCADE,
        related_name='aes_key',
    )
    key_value_encrypted = models.TextField()
    iv = models.CharField(max_length=32)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='generated_aes_keys',
        null=True,
    )
    sent_to_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'aes_keys'
        verbose_name = 'AES Key'
        verbose_name_plural = 'AES Keys'

    def __str__(self):
        return f'AESKey for File #{self.encrypted_file_id}'