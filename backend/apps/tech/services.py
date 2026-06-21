import os
from django.db import transaction
from django.core.exceptions import ValidationError

from apps.purchase.models import ApprovedMaterial
from apps.tech.models import EncryptedFile
from apps.encryption.models import EncryptionHistory
from apps.audit.models import AuditLog
from apps.accounts.models import User
from apps.common.services.notification_service import notify_many

from .crypto import generate_aes_key, wrap_aes_key, encrypt_file
from .utils import get_batch_id_for_approved_material, build_txt_filename, build_encrypted_filename, ensure_dir, media_path


def get_received_materials():
    return ApprovedMaterial.objects.filter(
        sent_to_tech=True,
    ).exclude(
        id__in=EncryptedFile.objects.values_list('approved_material_id', flat=True)
    ).select_related('material', 'material__vendor', 'purchase_user')


def group_received_materials_by_batch():
    received = get_received_materials()
    batches = {}

    for am in received:
        batch_key = get_batch_id_for_approved_material(am)
        if batch_key not in batches:
            batches[batch_key] = {
                'batch_id': batch_key,
                'vendor_name': f'{am.material.vendor.first_name} {am.material.vendor.last_name}'.strip() or am.material.vendor.username,
                'vendor_id': am.material.vendor_id,
                'material_count': 0,
                'upload_date': am.approved_at,
                'purchase_team_member': (
                    (f'{am.purchase_user.first_name} {am.purchase_user.last_name}'.strip() or am.purchase_user.username)
                    if am.purchase_user else 'Unknown'
                ),
                'status': 'PENDING_TXT',
            }
        batches[batch_key]['material_count'] += 1

    return list(batches.values())


def get_batch_materials(batch_id):
    received = get_received_materials()
    return [am for am in received if get_batch_id_for_approved_material(am) == batch_id]


def get_batch_materials_including_in_progress(batch_id):
    all_approved = ApprovedMaterial.objects.filter(sent_to_tech=True).select_related(
        'material', 'material__vendor', 'purchase_user'
    )
    return [am for am in all_approved if get_batch_id_for_approved_material(am) == batch_id]


def get_tech_dashboard_stats():
    received = get_received_materials().count()
    txt_generated = EncryptedFile.objects.exclude(txt_file='').count()
    encrypted = EncryptedFile.objects.exclude(encrypted_file='').count()
    pending_admin_approval = EncryptedFile.objects.filter(status='KEY_REQUESTED').count()
    completed = EncryptedFile.objects.filter(status='DECRYPTED').count()

    return {
        'materials_received': received,
        'txt_files_generated': txt_generated,
        'files_encrypted': encrypted,
        'pending_admin_approval': pending_admin_approval,
        'completed_encryptions': completed,
    }


@transaction.atomic
def generate_txt_for_batch(batch_id, tech_user):
    """
    Generates one TXT file listing all materials in the given batch,
    and creates one EncryptedFile row per material in that batch
    (sharing the same txt_file path) with encrypted_file left blank
    until the encrypt step runs.
    """
    batch_materials = get_batch_materials(batch_id)

    if not batch_materials:
        raise ValidationError('No approved materials found in this batch, or TXT already generated.')

    txt_filename = build_txt_filename(batch_id)
    relative_txt_path = os.path.join('generated_txt', txt_filename)
    full_txt_path = media_path(relative_txt_path)
    ensure_dir(full_txt_path)

    if os.path.isfile(full_txt_path):
        raise ValidationError('A TXT file has already been generated for this batch.')

    lines = []
    for am in batch_materials:
        m = am.material
        lines.append(f'Material ID : {m.material_code}')
        lines.append(f'Material Name : {m.material_name}')
        lines.append(f'Quantity : {am.edited_quantity}')
        lines.append(f'Cost : {am.edited_cost}')
        lines.append(f'Supplier : {m.supplier}')
        lines.append(f'Expiry Date : {m.expiry_date.isoformat()}')
        lines.append('')

    with open(full_txt_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    # Batched INSERT instead of one INSERT per material. Measured
    # before this fix: 500 materials = 504 queries, ~950ms for the
    # TXT-generation step alone. EncryptedFile's save()/signal status
    # must be confirmed clean (same check performed for Material in
    # the Vendor upload fix) before this is considered final.
    encrypted_file_objects = [
        EncryptedFile(
            approved_material=am,
            original_file=am.material.uploaded_file.name,
            txt_file=relative_txt_path,
            encrypted_file='',
            generated_by=tech_user,
            status='TXT_GENERATED',
        )
        for am in batch_materials
    ]
    EncryptedFile.objects.bulk_create(encrypted_file_objects)

    # Re-fetch to get real primary keys — bulk_create on MySQL does not
    # reliably populate auto-generated IDs on the in-memory instances.
    encrypted_file_records = list(
        EncryptedFile.objects.filter(
            approved_material_id__in=[am.id for am in batch_materials]
        )
    )

    AuditLog.objects.create(
        user=tech_user,
        role='TECH',
        action='TXT_GENERATED',
        description=f'TXT file generated for batch {batch_id} ({len(batch_materials)} material(s)).',
    )

    return {
        'batch_id': batch_id,
        'txt_path': relative_txt_path,
        'material_count': len(batch_materials),
        'encrypted_file_ids': [ef.id for ef in encrypted_file_records],
    }


@transaction.atomic
def encrypt_batch(batch_id, tech_user):
    """
    Encrypts the TXT file for the given batch using AES-256-CBC,
    generates and wraps a unique AES key, updates all EncryptedFile
    rows for the batch, creates an EncryptionHistory entry, and
    notifies all Admin users.
    """
    from apps.tech.models import AESKey

    batch_materials = get_batch_materials_including_in_progress(batch_id)
    encrypted_files = EncryptedFile.objects.filter(
        approved_material_id__in=[am.id for am in batch_materials],
    ).exclude(txt_file='')

    if not encrypted_files.exists():
        raise ValidationError('No TXT file found for this batch. Generate the TXT file first.')

    already_encrypted = encrypted_files.exclude(encrypted_file='').exists()
    if already_encrypted:
        raise ValidationError('This batch has already been encrypted.')

    first_ef = encrypted_files.first()
    relative_txt_path = first_ef.txt_file.name if hasattr(first_ef.txt_file, 'name') else str(first_ef.txt_file)
    full_txt_path = media_path(relative_txt_path)

    if not os.path.isfile(full_txt_path):
        raise ValidationError(f'TXT file not found on disk at: {relative_txt_path}')

    encrypted_filename = build_encrypted_filename(batch_id)
    relative_encrypted_path = os.path.join('encrypted', encrypted_filename)
    full_encrypted_path = media_path(relative_encrypted_path)
    ensure_dir(full_encrypted_path)

    raw_aes_key = generate_aes_key()
    iv_hex = encrypt_file(full_txt_path, full_encrypted_path, raw_aes_key)
    wrapped_key = wrap_aes_key(raw_aes_key)

    encrypted_files.update(
        encrypted_file=relative_encrypted_path,
        status='ENCRYPTED',
    )

    last_ef = encrypted_files.first()
    aes_key_record = AESKey.objects.create(
        encrypted_file=last_ef,
        key_value_encrypted=wrapped_key,
        iv=iv_hex,
        generated_by=tech_user,
        sent_to_admin=False,
    )

    EncryptionHistory.objects.create(
        encrypted_file=last_ef,
        action='ENCRYPTED',
        performed_by=tech_user,
    )

    AuditLog.objects.create(
        user=tech_user,
        role='TECH',
        action='FILE_ENCRYPTED',
        description=f'Batch {batch_id} encrypted ({encrypted_files.count()} material(s)).',
    )

    admin_users = User.objects.filter(role__name='ADMIN', is_active=True)
    notify_many(
        users=admin_users,
        title='Key Approval Needed',
        message='New encrypted batch is waiting for key approval.',
        notification_type='KEY_APPROVAL_NEEDED',
        related_object_id=aes_key_record.id,
    )

    return {
        'batch_id': batch_id,
        'encrypted_path': relative_encrypted_path,
        'material_count': encrypted_files.count(),
        'aes_key_id': aes_key_record.id,
    }


def get_encryption_history(search=None, vendor_id=None, status_filter=None):
    queryset = EncryptedFile.objects.select_related(
        'approved_material__material__vendor', 'generated_by'
    ).order_by('-created_at')

    if search:
        queryset = queryset.filter(approved_material__material__material_name__icontains=search)
    if vendor_id:
        queryset = queryset.filter(approved_material__material__vendor_id=vendor_id)
    if status_filter:
        queryset = queryset.filter(status=status_filter.upper())

    return queryset


def get_encryption_trend(days=14):
    from django.utils import timezone
    from django.db.models.functions import TruncDate
    from django.db.models import Count
    import datetime

    today = timezone.now().date()
    start_date = today - datetime.timedelta(days=days - 1)

    generated_raw = (
        EncryptedFile.objects.filter(created_at__date__gte=start_date)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(count=Count('id'))
    )
    encrypted_raw = (
        EncryptionHistory.objects.filter(action='ENCRYPTED', performed_at__date__gte=start_date)
        .annotate(day=TruncDate('performed_at'))
        .values('day')
        .annotate(count=Count('id'))
    )

    generated_by_day = {row['day']: row['count'] for row in generated_raw}
    encrypted_by_day = {row['day']: row['count'] for row in encrypted_raw}

    result = []
    for i in range(days):
        day = start_date + datetime.timedelta(days=i)
        result.append({
            'date': day.isoformat(),
            'generated': generated_by_day.get(day, 0),
            'encrypted': encrypted_by_day.get(day, 0),
        })

    return result


def get_encryption_status_breakdown():
    statuses = ['TXT_GENERATED', 'ENCRYPTED', 'KEY_REQUESTED', 'KEY_APPROVED', 'DECRYPTED']
    return [
        {'label': s.replace('_', ' ').title(), 'value': EncryptedFile.objects.filter(status=s).count()}
        for s in statuses
    ]


def get_tech_statistics():
    from django.utils import timezone

    today = timezone.now().date()

    total_encryptions = EncryptedFile.objects.exclude(encrypted_file='').count()
    todays_encryptions = EncryptionHistory.objects.filter(action='ENCRYPTED', performed_at__date=today).count()
    pending_files = EncryptedFile.objects.filter(status='TXT_GENERATED').count()
    completed_files = EncryptedFile.objects.filter(status='DECRYPTED').count()

    return {
        'total_encryptions': total_encryptions,
        'todays_encryptions': todays_encryptions,
        'pending_files': pending_files,
        'completed_files': completed_files,
    }