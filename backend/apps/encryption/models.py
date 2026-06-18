from django.conf import settings
from django.db import models
from apps.tech.models import EncryptedFile


class EncryptionHistory(models.Model):
    ENCRYPTED = 'ENCRYPTED'
    DECRYPTED = 'DECRYPTED'

    ACTION_CHOICES = [
        (ENCRYPTED, 'Encrypted'),
        (DECRYPTED, 'Decrypted'),
    ]

    encrypted_file = models.ForeignKey(
        EncryptedFile,
        on_delete=models.CASCADE,
        related_name='encryption_history',
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='encryption_actions',
        null=True,
    )
    performed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'encryption_history'
        verbose_name = 'Encryption History'
        verbose_name_plural = 'Encryption Histories'
        indexes = [
            models.Index(fields=['action']),
        ]

    def __str__(self):
        return f'{self.action} - File #{self.encrypted_file_id}'