from django.db import models
from django.conf import settings


class StaffProfile(models.Model):
    """
    Shared profile for Purchase, Tech, and Production users. Unlike
    Vendor (which has genuinely distinct fields like company_name and
    address, justifying its own VendorProfile), these three roles only
    differ by which department they belong to — one shared table,
    distinguished by the user's Role, rather than three near-identical
    models.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='staff_profile',
    )
    department = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        db_table = 'staff_profiles'
        verbose_name = 'Staff Profile'
        verbose_name_plural = 'Staff Profiles'

    def __str__(self):
        return f'{self.user.email} ({self.user.role}) - {self.department or "No department"}'