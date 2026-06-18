import os
from django.core.exceptions import ValidationError


def validate_batch_not_empty(approved_materials_queryset):
    if not approved_materials_queryset.exists():
        raise ValidationError('No approved materials found in this batch.')


def validate_txt_not_already_generated(encrypted_file_qs):
    if encrypted_file_qs.filter(txt_file__isnull=False).exclude(txt_file='').exists():
        raise ValidationError('A TXT file has already been generated for this batch.')


def validate_file_exists(file_path):
    if not file_path or not os.path.isfile(file_path):
        raise ValidationError(f'Required file not found at: {file_path}')


def validate_not_already_encrypted(encrypted_file):
    if encrypted_file.status == 'ENCRYPTED':
        raise ValidationError('This batch has already been encrypted.')


def validate_safe_path(base_dir, target_path):
    """
    Prevents path traversal — ensures the resolved target path stays
    inside the expected base directory.
    """
    base_real = os.path.realpath(base_dir)
    target_real = os.path.realpath(target_path)
    if not target_real.startswith(base_real):
        raise ValidationError('Invalid file path detected.')