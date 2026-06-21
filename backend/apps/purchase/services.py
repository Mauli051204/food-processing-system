from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from .models import Material, ApprovedMaterial, RejectedMaterial, UploadBatch
from apps.vendors.models import VendorRequest
from apps.audit.models import AuditLog
from apps.common.services.notification_service import notify, notify_many


def get_purchase_dashboard_stats():
    pending_vendor_requests = VendorRequest.objects.filter(status=VendorRequest.PENDING).count()
    pending_materials = Material.objects.filter(status=Material.APPROVED).exclude(
        id__in=ApprovedMaterial.objects.values_list('material_id', flat=True)
    ).exclude(
        id__in=RejectedMaterial.objects.values_list('material_id', flat=True)
    ).count()
    approved_materials = ApprovedMaterial.objects.count()
    rejected_materials = RejectedMaterial.objects.count()
    sent_to_tech = ApprovedMaterial.objects.filter(sent_to_tech=True).count()

    return {
        'pending_vendor_requests': pending_vendor_requests,
        'pending_materials': pending_materials,
        'approved_materials': approved_materials,
        'rejected_materials': rejected_materials,
        'sent_to_tech': sent_to_tech,
    }


def get_recent_requests():
    """
    Returns recent VendorRequest entries joined with vendor/company info
    for the dashboard's "Recent Requests" table.

    Previously issued up to 9 extra queries beyond the base list (one
    select_related('vendor') traversal does NOT cover the reverse
    OneToOne vendor_profile relation, and a separate UploadBatch
    lookup ran once per row inside the loop). Fixed by:
      1. select_related('vendor', 'vendor__vendor_profile') to cover
         both forward FK hops in the single base query.
      2. Prefetching all relevant vendors' latest UploadBatch in one
         query instead of querying per-row inside the loop.
    """
    requests = VendorRequest.objects.select_related(
        'vendor', 'vendor__vendor_profile'
    ).order_by('-requested_at')[:10]

    vendor_ids = [req.vendor_id for req in requests]

    # One query for all vendors' batches, instead of one query per row.
    # Ordered so the first occurrence per vendor_id (after the Python-side
    # dict build below) is the most recent batch for that vendor.
    latest_batches_by_vendor = {}
    for batch in UploadBatch.objects.filter(vendor_id__in=vendor_ids).order_by('-created_at'):
        if batch.vendor_id not in latest_batches_by_vendor:
            latest_batches_by_vendor[batch.vendor_id] = batch

    results = []
    for req in requests:
        company_name = ''
        if hasattr(req.vendor, 'vendor_profile'):
            company_name = req.vendor.vendor_profile.company_name

        latest_batch = latest_batches_by_vendor.get(req.vendor_id)

        results.append({
            'id': req.id,
            'vendor_name': f'{req.vendor.first_name} {req.vendor.last_name}'.strip() or req.vendor.username,
            'company': company_name,
            'upload_date': latest_batch.created_at if latest_batch else req.requested_at,
            'status': req.status,
        })
    return results



def get_vendor_approval_trend(days=14):
    """
    Daily counts of vendor requests by status (approved/rejected) over
    the last `days` days, for the Vendor Approval Trend line chart.
    Zero-filled for continuity, same pattern as Vendor's upload trend.
    """
    from django.utils import timezone
    from django.db.models.functions import TruncDate
    from django.db.models import Count
    import datetime

    today = timezone.now().date()
    start_date = today - datetime.timedelta(days=days - 1)

    raw = (
        VendorRequest.objects.filter(requested_at__date__gte=start_date)
        .annotate(day=TruncDate('requested_at'))
        .values('day', 'status')
        .annotate(count=Count('id'))
        .order_by('day')
    )

    by_day = {}
    for row in raw:
        day = row['day']
        by_day.setdefault(day, {'approved': 0, 'rejected': 0, 'pending': 0})
        if row['status'] == VendorRequest.APPROVED:
            by_day[day]['approved'] = row['count']
        elif row['status'] == VendorRequest.REJECTED:
            by_day[day]['rejected'] = row['count']
        elif row['status'] == VendorRequest.PENDING:
            by_day[day]['pending'] = row['count']

    result = []
    for i in range(days):
        day = start_date + datetime.timedelta(days=i)
        counts = by_day.get(day, {'approved': 0, 'rejected': 0, 'pending': 0})
        result.append({'date': day.isoformat(), **counts})

    return result


def get_material_approval_breakdown():
    """
    Counts of materials by their purchase-decision outcome, for the
    Material Approval / Approval vs Rejection pie chart. Distinct from
    Material.status (which only tracks vendor-side PENDING/APPROVED/
    REJECTED) — this reflects the actual ApprovedMaterial/RejectedMaterial
    decision tables.
    """
    pending_review = Material.objects.filter(status=Material.APPROVED).exclude(
        id__in=ApprovedMaterial.objects.values_list('material_id', flat=True)
    ).exclude(
        id__in=RejectedMaterial.objects.values_list('material_id', flat=True)
    ).count()

    approved = ApprovedMaterial.objects.count()
    rejected = RejectedMaterial.objects.count()

    return [
        {'label': 'Pending Review', 'value': pending_review},
        {'label': 'Approved', 'value': approved},
        {'label': 'Rejected', 'value': rejected},
    ]


def get_review_activity_trend(days=14):
    """
    Daily counts of approve/reject actions over the last `days` days,
    for the Review Activity / Monthly Reviews chart.
    """
    from django.utils import timezone
    from django.db.models.functions import TruncDate
    from django.db.models import Count
    import datetime

    today = timezone.now().date()
    start_date = today - datetime.timedelta(days=days - 1)

    approved_raw = (
        ApprovedMaterial.objects.filter(approved_at__date__gte=start_date)
        .annotate(day=TruncDate('approved_at'))
        .values('day')
        .annotate(count=Count('id'))
    )
    rejected_raw = (
        RejectedMaterial.objects.filter(rejected_at__date__gte=start_date)
        .annotate(day=TruncDate('rejected_at'))
        .values('day')
        .annotate(count=Count('id'))
    )

    approved_by_day = {row['day']: row['count'] for row in approved_raw}
    rejected_by_day = {row['day']: row['count'] for row in rejected_raw}

    result = []
    for i in range(days):
        day = start_date + datetime.timedelta(days=i)
        result.append({
            'date': day.isoformat(),
            'approved': approved_by_day.get(day, 0),
            'rejected': rejected_by_day.get(day, 0),
        })

    return result

def get_pending_materials_for_vendor(vendor_id=None):
    """
    Materials that the vendor has sent (status=APPROVED, vendor-side meaning
    "sent to purchase") but that Purchase hasn't yet approved or rejected.
    """
    queryset = Material.objects.filter(status=Material.APPROVED).exclude(
        id__in=ApprovedMaterial.objects.values_list('material_id', flat=True)
    ).exclude(
        id__in=RejectedMaterial.objects.values_list('material_id', flat=True)
    )
    if vendor_id:
        queryset = queryset.filter(vendor_id=vendor_id)
    return queryset


@transaction.atomic
def edit_material(material, purchase_user, new_quantity=None, new_cost=None):
    """
    Allows Purchase Team to adjust quantity/cost on a material before
    approving it. Tracks old/new values via an AuditLog entry.
    """
    if ApprovedMaterial.objects.filter(material=material).exists():
        raise ValidationError('This material has already been approved and is read-only.')
    if RejectedMaterial.objects.filter(material=material).exists():
        raise ValidationError('This material has been rejected and cannot be edited.')

    old_quantity = material.quantity
    old_cost = material.cost

    if new_quantity is not None:
        material.quantity = new_quantity
    if new_cost is not None:
        material.cost = new_cost

    material.save(update_fields=['quantity', 'cost'])

    AuditLog.objects.create(
        user=purchase_user,
        role='PURCHASE',
        action='MATERIAL_EDITED',
        description=(
            f'Material #{material.id} ({material.material_name}) edited. '
            f'Quantity: {old_quantity} -> {material.quantity}, Cost: {old_cost} -> {material.cost}.'
        ),
    )

    return material


@transaction.atomic
def approve_material(material, purchase_user, edited_quantity=None, edited_cost=None, remarks=''):
    if ApprovedMaterial.objects.filter(material=material).exists():
        raise ValidationError('This material has already been approved.')
    if RejectedMaterial.objects.filter(material=material).exists():
        raise ValidationError('This material has already been rejected and cannot be approved.')

    final_quantity = edited_quantity if edited_quantity is not None else material.quantity
    final_cost = edited_cost if edited_cost is not None else material.cost

    try:
        approved = ApprovedMaterial.objects.create(
            material=material,
            purchase_user=purchase_user,
            edited_quantity=final_quantity,
            edited_cost=final_cost,
            sent_to_tech=False,
        )
    except IntegrityError:
        raise ValidationError('This material has already been approved.')

    AuditLog.objects.create(
        user=purchase_user,
        role='PURCHASE',
        action='MATERIAL_APPROVED',
        description=f'Material #{material.id} ({material.material_name}) approved. Remarks: {remarks or "none"}.',
    )

    notify(
        user=material.vendor,
        title='Material Approved',
        message=f'Your material "{material.material_name}" has been approved by the Purchase Team.',
        notification_type='PURCHASE_APPROVAL',
        related_object_id=material.id,
    )

    return approved


@transaction.atomic
def reject_material(material, purchase_user, reason):
    if ApprovedMaterial.objects.filter(material=material).exists():
        raise ValidationError('This material has already been approved and cannot be rejected.')
    if RejectedMaterial.objects.filter(material=material).exists():
        raise ValidationError('This material has already been rejected.')

    try:
        rejected = RejectedMaterial.objects.create(
            material=material,
            purchase_user=purchase_user,
            rejection_reason=reason,
        )
    except IntegrityError:
        raise ValidationError('This material has already been rejected.')

    material.status = Material.REJECTED
    material.save(update_fields=['status'])

    AuditLog.objects.create(
        user=purchase_user,
        role='PURCHASE',
        action='MATERIAL_REJECTED',
        description=f'Material #{material.id} ({material.material_name}) rejected. Reason: {reason}.',
    )

    notify(
        user=material.vendor,
        title='Material Rejected',
        message=f'Your material "{material.material_name}" was rejected. Reason: {reason}.',
        notification_type='PURCHASE_REJECTION',
        related_object_id=material.id,
    )

    return rejected


@transaction.atomic
def send_approved_materials_to_tech(purchase_user, approved_material_ids):
    """
    Marks approved materials as sent to tech and creates a notification
    for the Tech Team. Does not implement any Tech module logic.
    """
    approved_materials = ApprovedMaterial.objects.filter(
        id__in=approved_material_ids,
        sent_to_tech=False,
    )

    if not approved_materials.exists():
        raise ValidationError('No eligible approved materials found to send.')

    count = approved_materials.count()
    approved_materials.update(sent_to_tech=True)

    AuditLog.objects.create(
        user=purchase_user,
        role='PURCHASE',
        action='SENT_TO_TECH',
        description=f'{count} approved material(s) sent to Tech Team.',
    )

    from apps.accounts.models import User
    tech_users = User.objects.filter(role__name='TECH', is_active=True)
    notify_many(
        users=tech_users,
        title='New Materials for Encryption',
        message=f'{count} approved material(s) have been sent to Tech for processing.',
        notification_type='TECH_NEW_MATERIALS',
    )

    return count