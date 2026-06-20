"""
Shared key-request approval/rejection logic.

This is the single implementation of "approve a key request" and "reject
a key request" in the system. Both apps/production/views.py and
apps/admin_panel/views.py call into this module — neither app implements
this logic itself, and neither app imports the other's views.
"""
import logging

from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.production.models import KeyRequest
from apps.tech.models import AESKey
from apps.audit.models import AuditLog
from apps.common.services.notification_service import notify

logger = logging.getLogger('key_request_service')


class KeyRequestNotFound(ValidationError):
    """Raised when the referenced KeyRequest does not exist."""
    pass


class KeyRequestAlreadyProcessed(ValidationError):
    """Raised when attempting to approve/reject a request that is no longer PENDING."""
    pass


def _validate_pending(key_request: KeyRequest) -> None:
    if key_request.status != KeyRequest.PENDING:
        logger.warning(
            'Key request #%s rejected for processing: status is "%s", not PENDING.',
            key_request.id, key_request.status,
        )
        raise KeyRequestAlreadyProcessed(
            'This key request has already been processed.'
        )


@transaction.atomic
def approve_key_request(key_request_id: int, admin_user) -> KeyRequest:
    try:
        key_request = KeyRequest.objects.select_for_update().get(id=key_request_id)
    except KeyRequest.DoesNotExist:
        logger.error('approve_key_request: KeyRequest #%s does not exist.', key_request_id)
        raise KeyRequestNotFound(f'Key request #{key_request_id} not found.')

    _validate_pending(key_request)

    encrypted_file = key_request.encrypted_file

    key_request.status = KeyRequest.APPROVED
    key_request.approved_by = admin_user
    key_request.approved_at = timezone.now()
    key_request.save()

    encrypted_file.status = 'KEY_APPROVED'
    encrypted_file.save(update_fields=['status'])

    AESKey.objects.filter(encrypted_file=encrypted_file).update(sent_to_admin=True)

    AuditLog.objects.create(
        user=admin_user,
        role='ADMIN',
        action='KEY_REQUEST_APPROVED',
        description=f'Key request #{key_request.id} approved for EncryptedFile #{encrypted_file.id}.',
    )

    notify(
        user=key_request.requested_by,
        title='Key Request Approved',
        message=f'Your key request for batch #{encrypted_file.id} has been approved.',
        notification_type='KEY_REQUEST_APPROVED',
        related_object_id=key_request.id,
    )

    logger.info('Key request #%s approved by admin user #%s.', key_request.id, admin_user.id)
    return key_request


@transaction.atomic
def reject_key_request(key_request_id: int, admin_user, reason: str = '') -> KeyRequest:
    try:
        key_request = KeyRequest.objects.select_for_update().get(id=key_request_id)
    except KeyRequest.DoesNotExist:
        logger.error('reject_key_request: KeyRequest #%s does not exist.', key_request_id)
        raise KeyRequestNotFound(f'Key request #{key_request_id} not found.')

    _validate_pending(key_request)

    encrypted_file = key_request.encrypted_file

    key_request.status = KeyRequest.REJECTED
    key_request.save()

    encrypted_file.status = 'ENCRYPTED'
    encrypted_file.save(update_fields=['status'])

    AuditLog.objects.create(
        user=admin_user,
        role='ADMIN',
        action='KEY_REQUEST_REJECTED',
        description=f'Key request #{key_request.id} rejected for EncryptedFile #{encrypted_file.id}.'
                    + (f' Reason: {reason}.' if reason else ''),
    )

    notify(
        user=key_request.requested_by,
        title='Key Request Rejected',
        message=f'Your key request for batch #{encrypted_file.id} has been rejected.'
                + (f' Reason: {reason}' if reason else ''),
        notification_type='KEY_REQUEST_REJECTED',
        related_object_id=key_request.id,
    )

    logger.info('Key request #%s rejected by admin user #%s.', key_request.id, admin_user.id)
    return key_request