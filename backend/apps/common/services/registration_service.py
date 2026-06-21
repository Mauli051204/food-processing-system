"""
Shared registration logic for staff roles (Purchase, Tech, Production).
Vendor registration stays in apps.vendors — it predates this module
and has genuinely distinct fields (company_name, address) that don't
fit this shared shape, so it isn't migrated here.
"""
from django.db import transaction

from apps.accounts.models import User, Role
from apps.common.models import StaffProfile
from apps.audit.models import AuditLog
from apps.common.services.notification_service import notify_many


@transaction.atomic
def register_staff_user(validated_data, role_name: str) -> User:
    """
    Creates a new, unapproved User of the given role plus their
    StaffProfile, logs the registration, and notifies all Admins.

    role_name must be one of 'PURCHASE', 'TECH', 'PRODUCTION'.
    """
    name_parts = validated_data['full_name'].strip().split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    role = Role.objects.get(name=role_name)

    user = User(
        username=validated_data['email'],
        email=validated_data['email'],
        first_name=first_name,
        last_name=last_name,
        phone=validated_data['phone'],
        role=role,
        is_active=False,
        is_approved=False,
    )
    user.set_password(validated_data['password'])
    user.save()

    StaffProfile.objects.create(
        user=user,
        department=validated_data.get('department', ''),
    )

    AuditLog.objects.create(
        user=user,
        role=role_name,
        action='USER_REGISTERED',
        description=f'New {role_name.title()} registration: {user.email}.',
    )

    admin_users = User.objects.filter(role__name='ADMIN', is_active=True)
    notify_many(
        users=admin_users,
        title='New Registration Received',
        message=f'A new {role_name.title()} account ({user.email}) is awaiting approval.',
        notification_type='NEW_REGISTRATION',
    )

    return user