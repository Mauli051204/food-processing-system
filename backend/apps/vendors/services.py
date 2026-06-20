import os
import uuid
from django.conf import settings
from .validators import validate_uploaded_file, parse_material_file, validate_material_row
from apps.purchase.models import Material, UploadBatch


def check_duplicate_filename(vendor, original_filename):
    """
    Prevents the same vendor from uploading a file with an identical
    original name more than once, regardless of whether that previous
    upload had any valid rows.
    """
    return UploadBatch.objects.filter(
        vendor=vendor,
        original_filename=original_filename,
    ).exists()


def process_vendor_upload(vendor, uploaded_file):
    """
    Validates and parses an uploaded CSV/XLSX file, persists valid rows
    as Material records, and records the batch summary in UploadBatch.

    Raises ValidationError (propagated from validators) for file-level
    failures that should reject the whole upload before any DB writes.
    """
    file_extension = validate_uploaded_file(uploaded_file)

    if check_duplicate_filename(vendor, uploaded_file.name):
        from django.core.exceptions import ValidationError
        raise ValidationError(f'A file named "{uploaded_file.name}" was already uploaded.')

    safe_name = f'{uuid.uuid4().hex}_{uploaded_file.name}'
    relative_path = os.path.join('uploads', 'csv_xlsx', safe_name)
    full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    with open(full_path, 'wb') as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    df = parse_material_file(full_path, file_extension)

    imported_count = 0
    rejected_count = 0
    rejected_rows = []
    created_materials = []

    file_type = 'CSV' if file_extension == '.csv' else 'XLSX'

    for index, row in df.iterrows():
        is_valid, cleaned, errors = validate_material_row(row, index)

        if not is_valid:
            rejected_count += 1
            rejected_rows.append({
                'row_number': index + 2,
                'errors': errors,
            })
            continue

        material = Material.objects.create(
            vendor=vendor,
            material_code=cleaned['material_code'],
            material_name=cleaned['material_name'],
            quantity=cleaned['quantity'],
            cost=cleaned['cost'],
            supplier=cleaned['supplier'],
            expiry_date=cleaned['expiry_date'],
            uploaded_file=relative_path,
            file_type=file_type,
            status=Material.PENDING,
        )
        created_materials.append(material)
        imported_count += 1

    UploadBatch.objects.create(
        vendor=vendor,
        original_filename=uploaded_file.name,
        stored_file_path=relative_path,
        uploaded_rows=len(df),
        imported_rows=imported_count,
        rejected_rows=rejected_count,
        status='PENDING',
    )

    return {
        'file_name': uploaded_file.name,
        'uploaded_rows': len(df),
        'imported_rows': imported_count,
        'rejected_rows': rejected_count,
        'rejected_details': rejected_rows,
        'materials': created_materials,
    }


def get_vendor_dashboard_stats(vendor):
    """
    Aggregates counts for the vendor dashboard cards.
    """
    materials = Material.objects.filter(vendor=vendor)

    total_uploads = UploadBatch.objects.filter(vendor=vendor).count()
    pending = materials.filter(status=Material.PENDING).count()
    sent_to_purchase = materials.filter(status=Material.APPROVED).count()
    rejected = materials.filter(status=Material.REJECTED).count()

    return {
        'total_uploads': total_uploads,
        'pending_uploads': pending,
        'sent_to_purchase': sent_to_purchase,
        'rejected_uploads': rejected,
    }



def get_upload_trend(vendor, days=14):
    """
    Returns upload counts grouped by day for the last `days` days,
    for the Vendor dashboard's Upload Trend line chart. Days with zero
    uploads are included with a count of 0, so the chart has a
    continuous x-axis rather than gaps.
    """
    from django.utils import timezone
    from django.db.models.functions import TruncDate
    from django.db.models import Count
    import datetime

    today = timezone.now().date()
    start_date = today - datetime.timedelta(days=days - 1)

    raw_counts = (
        UploadBatch.objects.filter(vendor=vendor, created_at__date__gte=start_date)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    counts_by_day = {row['day']: row['count'] for row in raw_counts}

    result = []
    for i in range(days):
        day = start_date + datetime.timedelta(days=i)
        result.append({
            'date': day.isoformat(),
            'count': counts_by_day.get(day, 0),
        })

    return result



def get_material_status_breakdown(vendor):
    """
    Returns counts of materials by status for the Vendor dashboard's
    Material Status pie chart. Distinct from get_vendor_dashboard_stats
    since this is specifically shaped for chart consumption (a flat
    list of {label, value} pairs) rather than dashboard cards.
    """
    materials = Material.objects.filter(vendor=vendor)

    return [
        {'label': 'Pending', 'value': materials.filter(status=Material.PENDING).count()},
        {'label': 'Sent to Purchase', 'value': materials.filter(status=Material.APPROVED).count()},
        {'label': 'Rejected', 'value': materials.filter(status=Material.REJECTED).count()},
    ]

    

def get_upload_history(vendor):
    """
    Returns one entry per upload batch, with accurate imported/rejected
    row counts pulled directly from the UploadBatch record rather than
    inferred from the Material table (which never stores rejected rows).
    """
    batches = UploadBatch.objects.filter(vendor=vendor).order_by('-created_at')

    return [
        {
            'file_name': b.original_filename,
            'uploaded_at': b.created_at,
            'rows_imported': b.imported_rows,
            'rows_rejected': b.rejected_rows,
            'status': b.status,
        }
        for b in batches
    ]


def send_materials_to_purchase(vendor, material_ids):
    """
    Marks the given materials as sent to purchase, validating that
    they belong to this vendor and are still pending.
    """
    from django.core.exceptions import ValidationError
    from apps.vendors.models import VendorRequest

    materials = Material.objects.filter(
        id__in=material_ids,
        vendor=vendor,
        status=Material.PENDING,
    )

    if not materials.exists():
        raise ValidationError('No pending materials found for the given IDs.')

    count = materials.count()
    materials.update(status=Material.APPROVED)

    VendorRequest.objects.create(
        vendor=vendor,
        status=VendorRequest.PENDING,
        remarks=f'{count} material(s) sent to purchase team.',
    )

    return count