from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    ADMIN = 'ADMIN'
    VENDOR = 'VENDOR'
    PURCHASE = 'PURCHASE'
    TECH = 'TECH'
    PRODUCTION = 'PRODUCTION'

    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (VENDOR, 'Vendor'),
        (PURCHASE, 'Purchase'),
        (TECH, 'Tech'),
        (PRODUCTION, 'Production'),
    ]

    name = models.CharField(max_length=50, unique=True, choices=ROLE_CHOICES)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name


class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name='users',
        null=True,
        blank=True,
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['is_approved']),
        ]

    def __str__(self):
        return f'{self.email} ({self.role})'

    def is_admin(self):
        return self.role and self.role.name == Role.ADMIN

    def is_vendor(self):
        return self.role and self.role.name == Role.VENDOR