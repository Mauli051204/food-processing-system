from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.accounts.models import User, Role
from apps.vendors.models import VendorProfile
from apps.purchase.models import Material, ApprovedMaterial, RejectedMaterial, UploadBatch
from apps.tech.models import EncryptedFile, AESKey
from apps.production.models import KeyRequest, DownloadHistory
from apps.audit.models import AuditLog
from apps.notifications.models import Notification
from apps.common.services.notification_service import notify

from .validators import validate_user_pending_approval, validate_user_not_admin
from .utils import get_user_display_name


def get_admin_dashboard_stats():
    total_users = User.objects.count()
    total_vendors = User.objects.filter(role__name='VENDOR').count()
    total_purchase = User.objects.filter(role__name='PURCHASE').count()
    total_tech = User.objects.filter(role__name='TECH').count()
    total_production = User.objects.filter(role__name='PRODUCTION').count()
    pending_approvals = User.objects.filter(is_approved=False).exclude(role__name='ADMIN').count()
    pending_key_requests = KeyRequest.objects.filter(status=KeyRequest.PENDING).count()
    total_uploaded_files = UploadBatch.objects.count()
    total_approved_materials = ApprovedMaterial.objects.count()
    total_rejected_materials = RejectedMaterial.objects.count()
    total_encrypted_files = EncryptedFile.objects.exclude(encrypted_file='').count()
    total_decrypted_files = EncryptedFile.objects.filter(status='DECRYPTED').count()
    total_downloads = DownloadHistory.objects.count()

    return {
        'total_users': total_users,
        'total_vendors': total_vendors,
        'total_purchase_team': total_purchase,
        'total_tech_team': total_tech,
        'total_production_team': total_production,
        'pending_user_approvals': pending_approvals,
        'pending_key_requests': pending_key_requests,
        'total_uploaded_files': total_uploaded_files,
        'total_approved_materials': total_approved_materials,
        'total_rejected_materials': total_rejected_materials,
        'total_encrypted_files': total_encrypted_files,
        'total_decrypted_files': total_decrypted_files,
        'total_downloads': total_downloads,
    }


def get_recent_activity():
    return {
        'latest_registrations': [
            {
                'id': u.id,
                'name': get_user_display_name(u),
                'email': u.email,
                'role': u.role.name if u.role else None,
                'date': u.date_joined,
            }
            for u in User.objects.order_by('-date_joined')[:5]
        ],
        'latest_uploads': [
            {
                'file_name': b.original_filename,
                'vendor': get_user_display_name(b.vendor),
                'date': b.created_at,
            }
            for b in UploadBatch.objects.order_by('-created_at')[:5]
        ],
        'latest_encryptions': [
            {
                'id': e.id,
                'material': e.approved_material.material.material_name,
                'status': e.status,
                'date': e.created_at,
            }
            for e in EncryptedFile.objects.order_by('-created_at')[:5]
        ],
        'latest_downloads': [
            {
                'id': d.id,
                'user': get_user_display_name(d.production_user),
                'file': d.downloaded_file_path,
                'date': d.downloaded_at,
            }
            for d in DownloadHistory.objects.order_by('-downloaded_at')[:5]
        ],
        'latest_audit_logs': [
            {
                'id': a.id,
                'action': a.action,
                'description': a.description,
                'date': a.timestamp,
            }
            for a in AuditLog.objects.order_by('-timestamp')[:5]
        ],
    }


def get_all_users(search=None, role_filter=None, status_filter=None):
    queryset = User.objects.select_related('role').exclude(role__name='ADMIN').order_by('-date_joined')

    if search:
        queryset = queryset.filter(email__icontains=search) | queryset.filter(first_name__icontains=search)
    if role_filter:
        queryset = queryset.filter(role__name=role_filter.upper())
    if status_filter == 'pending':
        queryset = queryset.filter(is_approved=False)
    elif status_filter == 'approved':
        queryset = queryset.filter(is_approved=True)
    elif status_filter == 'active':
        queryset = queryset.filter(is_active=True)
    elif status_filter == 'inactive':
        queryset = queryset.filter(is_active=False)

    return queryset


@transaction.atomic
def approve_user(user, admin_user):
    validate_user_not_admin(user)
    validate_user_pending_approval(user)

    user.is_approved = True
    user.is_active = True
    user.save(update_fields=['is_approved', 'is_active'])

    AuditLog.objects.create(
        user=admin_user,
        role='ADMIN',
        action='USER_APPROVED',
        description=f'User {user.email} ({user.role}) approved.',
    )

    notify(
        user=user,
        title='Account Approved',
        message='Your account has been approved. You can now log in.',
        notification_type='USER_APPROVAL',
    )

    return user


@transaction.atomic
def reject_user(user, admin_user, reason=''):
    validate_user_not_admin(user)

    user.is_approved = False
    user.is_active = False
    user.save(update_fields=['is_approved', 'is_active'])

    AuditLog.objects.create(
        user=admin_user,
        role='ADMIN',
        action='USER_REJECTED',
        description=f'User {user.email} ({user.role}) rejected. Reason: {reason or "none"}.',
    )

    notify(
        user=user,
        title='Account Rejected',
        message=f'Your account registration was rejected. {("Reason: " + reason) if reason else ""}',
        notification_type='USER_REJECTION',
    )

    return user


@transaction.atomic
def activate_user(user, admin_user):
    validate_user_not_admin(user)
    user.is_active = True
    user.save(update_fields=['is_active'])

    AuditLog.objects.create(
        user=admin_user,
        role='ADMIN',
        action='USER_ACTIVATED',
        description=f'User {user.email} activated.',
    )
    return user


@transaction.atomic
def deactivate_user(user, admin_user):
    validate_user_not_admin(user)
    user.is_active = False
    user.save(update_fields=['is_active'])

    AuditLog.objects.create(
        user=admin_user,
        role='ADMIN',
        action='USER_DEACTIVATED',
        description=f'User {user.email} deactivated.',
    )

    notify(
        user=user,
        title='Account Deactivated',
        message='Your account has been deactivated by an administrator.',
        notification_type='USER_DEACTIVATED',
    )
    return user


def get_encryption_management_data(search=None, status_filter=None):
    queryset = EncryptedFile.objects.select_related(
        'approved_material__material__vendor', 'generated_by'
    ).order_by('-created_at')

    if search:
        queryset = queryset.filter(approved_material__material__material_name__icontains=search)
    if status_filter:
        queryset = queryset.filter(status=status_filter.upper())

    return queryset


def get_download_management_data(search=None):
    queryset = DownloadHistory.objects.select_related(
        'production_user', 'encrypted_file__approved_material__material__vendor'
    ).order_by('-downloaded_at')

    if search:
        queryset = queryset.filter(production_user__email__icontains=search)

    return queryset


def get_audit_logs(search=None, user_filter=None, action_filter=None, date_from=None, date_to=None):
    queryset = AuditLog.objects.select_related('user').order_by('-timestamp')

    if search:
        queryset = queryset.filter(description__icontains=search)
    if user_filter:
        queryset = queryset.filter(user_id=user_filter)
    if action_filter:
        queryset = queryset.filter(action__icontains=action_filter)
    if date_from:
        queryset = queryset.filter(timestamp__gte=date_from)
    if date_to:
        queryset = queryset.filter(timestamp__lte=date_to)

    return queryset


def get_all_notifications(read_filter=None):
    """
    Admin-only: lists notifications ACROSS ALL USERS, not scoped to the
    requesting admin. This is intentionally different from
    notification_service.get_notifications_for_user(), which is
    per-user by design. Admin needs system-wide visibility; this
    function stays in admin_panel/services.py rather than the shared
    service since it's an Admin-specific concern, not a general
    notification-retrieval concern.
    """
    queryset = Notification.objects.select_related('user').order_by('-created_at')

    if read_filter == 'read':
        queryset = queryset.filter(is_read=True)
    elif read_filter == 'unread':
        queryset = queryset.filter(is_read=False)

    return queryset


def mark_notification_read(notification):
    notification.is_read = True
    notification.save(update_fields=['is_read'])
    return notification


def get_or_create_settings():
    from .models import SystemSetting
    return SystemSetting.get_settings()


@transaction.atomic
def update_settings(settings_obj, data, admin_user):
    from .validators import validate_settings_values
    validate_settings_values(data)

    for field in ['application_name', 'company_name', 'max_upload_size_mb', 'allowed_file_types', 'session_timeout_minutes', 'password_min_length']:
        if field in data:
            setattr(settings_obj, field, data[field])
    settings_obj.save()

    AuditLog.objects.create(
        user=admin_user,
        role='ADMIN',
        action='SETTINGS_UPDATED',
        description='System settings updated.',
    )

    return settings_obj