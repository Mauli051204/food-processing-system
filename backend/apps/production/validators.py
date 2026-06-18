from django.core.exceptions import ValidationError


def validate_encrypted_file_available(encrypted_file):
    if encrypted_file.status != 'ENCRYPTED':
        raise ValidationError('This batch is not available for key request (already requested, approved, or not yet encrypted).')


def validate_no_duplicate_key_request(encrypted_file, production_user):
    from .models import KeyRequest
    existing = KeyRequest.objects.filter(
        encrypted_file=encrypted_file,
        requested_by=production_user,
        status=KeyRequest.PENDING,
    ).exists()
    if existing:
        raise ValidationError('A key request is already pending for this batch.')


def validate_key_request_approved(key_request):
    from .models import KeyRequest
    if key_request.status != KeyRequest.APPROVED:
        raise ValidationError('This key request has not been approved yet.')


def validate_not_already_decrypted(encrypted_file):
    if encrypted_file.status == 'DECRYPTED':
        raise ValidationError('This batch has already been decrypted.')