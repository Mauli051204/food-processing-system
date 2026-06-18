from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError


class VendorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor_profile',
    )
    company_name = models.CharField(max_length=255)
    address = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vendor_profiles'
        verbose_name = 'Vendor Profile'
        verbose_name_plural = 'Vendor Profiles'

    def __str__(self):
        return f'{self.company_name} ({self.user.email})'

    def clean(self):
        if self.user.role and self.user.role.name != 'VENDOR':
            raise ValidationError('VendorProfile can only be linked to a user with VENDOR role.')


class VendorRequest(models.Model):
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
        related_name='vendor_requests',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='reviewed_vendor_requests',
        null=True,
        blank=True,
    )
    remarks = models.CharField(max_length=255, blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'vendor_requests'
        verbose_name = 'Vendor Request'
        verbose_name_plural = 'Vendor Requests'
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.vendor.email} - {self.status}'

