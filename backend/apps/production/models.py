from django.conf import settings
from django.db import models
from apps.tech.models import EncryptedFile


class KeyRequest(models.Model):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]

    encrypted_file = models.ForeignKey(
        EncryptedFile,
        on_delete=models.CASCADE,
        related_name='key_requests',
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='key_requests',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='approved_key_requests',
        null=True,
        blank=True,
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'key_requests'
        verbose_name = 'Key Request'
        verbose_name_plural = 'Key Requests'
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'KeyRequest #{self.id} - {self.status}'


class DownloadHistory(models.Model):
    production_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='download_history',
    )
    encrypted_file = models.ForeignKey(
        EncryptedFile,
        on_delete=models.CASCADE,
        related_name='download_history',
    )
    downloaded_file_path = models.CharField(max_length=500)
    downloaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'download_history'
        verbose_name = 'Download History'
        verbose_name_plural = 'Download Histories'

    def __str__(self):
        return f'Download #{self.id} by {self.production_user.email}'