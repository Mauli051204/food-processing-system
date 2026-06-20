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
    """
    requests = VendorRequest.objects.select_related('vendor').order_by('-requested_at')[:10]
    results = []
    for req in requests:
        company_name = ''
        if hasattr(req.vendor, 'vendor_profile'):
            company_name = req.vendor.vendor_profile.company_name

        latest_batch = UploadBatch.objects.filter(vendor=req.vendor).order_by('-created_at').first()

        results.append({
            'id': req.id,
            'vendor_name': f'{req.vendor.first_name} {req.vendor.last_name}'.strip() or req.vendor.username,
            'company': company_name,
            'upload_date': latest_batch.created_at if latest_batch else req.requested_at,
            'status': req.status,
        })
    return results


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