import os
from django.db import transaction
from django.core.exceptions import ValidationError

from apps.tech.models import EncryptedFile, AESKey
from apps.production.models import KeyRequest, DownloadHistory
from apps.audit.models import AuditLog
from apps.notifications.models import Notification
from apps.accounts.models import User

from apps.production.crypto import unwrap_aes_key, decrypt_file_to_bytes
from apps.production.validators import (
    validate_encrypted_file_available,
    validate_no_duplicate_key_request,
    validate_not_already_decrypted,
)
from apps.production.utils import media_path, ensure_dir, build_decrypted_filename


def get_production_dashboard_stats():
    available_batches = EncryptedFile.objects.filter(status='ENCRYPTED').count()
    pending_requests = KeyRequest.objects.filter(status=KeyRequest.PENDING).count()
    approved_requests = KeyRequest.objects.filter(status=KeyRequest.APPROVED).count()
    decrypted_files = EncryptedFile.objects.filter(status='DECRYPTED').count()
    downloads = DownloadHistory.objects.count()

    return {
        'available_batches': available_batches,
        'pending_key_requests': pending_requests,
        'approved_key_requests': approved_requests,
        'decrypted_files': decrypted_files,
        'downloads': downloads,
    }


def get_available_encrypted_files(search=None):
    queryset = EncryptedFile.objects.filter(status='ENCRYPTED').select_related(
        'approved_material__material__vendor'
    ).order_by('-created_at')

    if search:
        queryset = queryset.filter(approved_material__material__vendor__first_name__icontains=search)

    return queryset


@transaction.atomic
def request_key(encrypted_file, production_user):
    validate_encrypted_file_available(encrypted_file)
    validate_no_duplicate_key_request(encrypted_file, production_user)

    key_request = KeyRequest.objects.create(
        encrypted_file=encrypted_file,
        requested_by=production_user,
        status=KeyRequest.PENDING,
    )

    encrypted_file.status = 'KEY_REQUESTED'
    encrypted_file.save(update_fields=['status'])

    AuditLog.objects.create(
        user=production_user,
        role='PRODUCTION',
        action='KEY_REQUESTED',
        description=f'Key requested for EncryptedFile #{encrypted_file.id}.',
    )

    admin_users = User.objects.filter(role__name='ADMIN', is_active=True)
    for admin_user in admin_users:
        Notification.objects.create(
            user=admin_user,
            title='New Key Request',
            message=f'Production team requested a key for batch #{encrypted_file.id}.',
            notification_type='KEY_REQUEST_PENDING',
            related_object_id=key_request.id,
        )

    return key_request


def get_key_requests_for_user(production_user):
    return KeyRequest.objects.filter(requested_by=production_user).select_related(
        'encrypted_file__approved_material__material__vendor'
    ).order_by('-requested_at')


@transaction.atomic
def decrypt_batch(encrypted_file, production_user):
    """
    Looks up the approved KeyRequest for this file/user, unwraps the
    AES key in memory only, decrypts the file, writes the plaintext
    TXT to /media/decrypted/, and immediately discards the key.
    """
    key_request = KeyRequest.objects.filter(
        encrypted_file=encrypted_file,
        requested_by=production_user,
        status=KeyRequest.APPROVED,
    ).order_by('-approved_at').first()

    if not key_request:
        raise ValidationError('No approved key request found for this batch.')

    validate_not_already_decrypted(encrypted_file)

    aes_key_record = AESKey.objects.filter(encrypted_file=encrypted_file).first()
    if not aes_key_record:
        raise ValidationError('No AES key found for this encrypted file.')

    full_encrypted_path = media_path(str(encrypted_file.encrypted_file))
    if not os.path.isfile(full_encrypted_path):
        raise ValidationError(f'Encrypted file not found on disk at: {encrypted_file.encrypted_file}')

    raw_key = None
    try:
        raw_key = unwrap_aes_key(aes_key_record.key_value_encrypted)
        plaintext = decrypt_file_to_bytes(full_encrypted_path, raw_key, aes_key_record.iv)
    finally:
        raw_key = None

    decrypted_filename = build_decrypted_filename(encrypted_file.id)
    relative_decrypted_path = os.path.join('decrypted', decrypted_filename)
    full_decrypted_path = media_path(relative_decrypted_path)
    ensure_dir(full_decrypted_path)

    with open(full_decrypted_path, 'wb') as f:
        f.write(plaintext)

    encrypted_file.status = 'DECRYPTED'
    encrypted_file.save(update_fields=['status'])

    from apps.encryption.models import EncryptionHistory
    EncryptionHistory.objects.create(
        encrypted_file=encrypted_file,
        action='DECRYPTED',
        performed_by=production_user,
    )

    AuditLog.objects.create(
        user=production_user,
        role='PRODUCTION',
        action='FILE_DECRYPTED',
        description=f'EncryptedFile #{encrypted_file.id} decrypted.',
    )

    return relative_decrypted_path


def get_decrypted_file_path(encrypted_file):
    decrypted_filename = build_decrypted_filename(encrypted_file.id)
    relative_path = os.path.join('decrypted', decrypted_filename)
    full_path = media_path(relative_path)
    if not os.path.isfile(full_path):
        raise ValidationError('Decrypted file not found. Please decrypt the batch first.')
    return full_path, decrypted_filename


@transaction.atomic
def record_download(encrypted_file, production_user, file_name, ip_address=None):
    download = DownloadHistory.objects.create(
        production_user=production_user,
        encrypted_file=encrypted_file,
        downloaded_file_path=file_name,
    )

    AuditLog.objects.create(
        user=production_user,
        role='PRODUCTION',
        action='FILE_DOWNLOADED',
        description=f'EncryptedFile #{encrypted_file.id} downloaded. IP: {ip_address or "unknown"}.',
    )

    return download


def get_download_history(production_user=None, search=None):
    queryset = DownloadHistory.objects.select_related(
        'production_user', 'encrypted_file__approved_material__material__vendor'
    ).order_by('-downloaded_at')

    if production_user:
        queryset = queryset.filter(production_user=production_user)
    if search:
        queryset = queryset.filter(
            encrypted_file__approved_material__material__vendor__first_name__icontains=search
        )

    return queryset


def get_production_history(production_user):
    key_requests = KeyRequest.objects.filter(requested_by=production_user).select_related(
        'encrypted_file__approved_material__material__vendor'
    ).order_by('-requested_at')

    results = []
    for kr in key_requests:
        ef = kr.encrypted_file
        vendor = ef.approved_material.material.vendor
        last_download = DownloadHistory.objects.filter(
            encrypted_file=ef, production_user=production_user
        ).order_by('-downloaded_at').first()

        results.append({
            'batch_id': ef.id,
            'vendor_name': f'{vendor.first_name} {vendor.last_name}'.strip() or vendor.username,
            'request_date': kr.requested_at,
            'approval_date': kr.approved_at,
            'download_date': last_download.downloaded_at if last_download else None,
            'status': ef.status,
        })

    return results

def get_download_trend(production_user, days=14):
    """
    Daily download counts for this production user over the last
    `days` days, for the Download Trend / Daily Downloads chart.
    """
    from django.utils import timezone
    from django.db.models.functions import TruncDate
    from django.db.models import Count
    import datetime

    today = timezone.now().date()
    start_date = today - datetime.timedelta(days=days - 1)

    raw = (
        DownloadHistory.objects.filter(production_user=production_user, downloaded_at__date__gte=start_date)
        .annotate(day=TruncDate('downloaded_at'))
        .values('day')
        .annotate(count=Count('id'))
    )
    by_day = {row['day']: row['count'] for row in raw}

    result = []
    for i in range(days):
        day = start_date + datetime.timedelta(days=i)
        result.append({'date': day.isoformat(), 'count': by_day.get(day, 0)})

    return result


def get_key_request_status_breakdown(production_user):
    """
    Counts of this user's key requests grouped by status, for the
    Key Request Status / Key Request Distribution pie chart.
    """
    requests = KeyRequest.objects.filter(requested_by=production_user)
    return [
        {'label': 'Pending', 'value': requests.filter(status=KeyRequest.PENDING).count()},
        {'label': 'Approved', 'value': requests.filter(status=KeyRequest.APPROVED).count()},
        {'label': 'Rejected', 'value': requests.filter(status=KeyRequest.REJECTED).count()},
    ]


def get_production_statistics(production_user):
    """
    Cards for the Production Statistics page.
    """
    from django.utils import timezone

    today = timezone.now().date()

    total_downloads = DownloadHistory.objects.filter(production_user=production_user).count()
    todays_downloads = DownloadHistory.objects.filter(
        production_user=production_user, downloaded_at__date=today
    ).count()
    requests = KeyRequest.objects.filter(requested_by=production_user)
    pending_requests = requests.filter(status=KeyRequest.PENDING).count()
    approved_requests = requests.filter(status=KeyRequest.APPROVED).count()
    rejected_requests = requests.filter(status=KeyRequest.REJECTED).count()

    return {
        'total_downloads': total_downloads,
        'todays_downloads': todays_downloads,
        'pending_requests': pending_requests,
        'approved_requests': approved_requests,
        'rejected_requests': rejected_requests,
    }