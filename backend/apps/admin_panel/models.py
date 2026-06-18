from django.db import models


class SystemSetting(models.Model):
    """
    Single-row table holding configurable application settings.
    AES_MASTER_KEY is intentionally NOT stored here — it lives only
    in the .env file and is never displayed unmasked or made editable
    through this model, per the spec's security requirement.
    """
    application_name = models.CharField(max_length=255, default='Food Processing System')
    company_name = models.CharField(max_length=255, default='')
    max_upload_size_mb = models.IntegerField(default=10)
    allowed_file_types = models.CharField(max_length=255, default='.csv,.xlsx')
    session_timeout_minutes = models.IntegerField(default=1440)
    password_min_length = models.IntegerField(default=8)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'

    def __str__(self):
        return self.application_name

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj