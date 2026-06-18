import os
from django.conf import settings


def get_batch_id_for_approved_material(approved_material):
    """
    Since approved materials sent together don't have an explicit
    batch ID in the current schema, we use the approved_at timestamp
    (truncated to the minute) combined with vendor as a stable
    grouping key for materials sent to tech in the same action.
    """
    material = approved_material.material
    return f'{material.vendor_id}_{approved_material.approved_at.strftime("%Y%m%d%H%M")}'


def build_txt_filename(batch_key):
    safe_key = batch_key.replace(':', '').replace(' ', '_')
    return f'batch_{safe_key}.txt'


def build_encrypted_filename(batch_key):
    safe_key = batch_key.replace(':', '').replace(' ', '_')
    return f'batch_{safe_key}.enc'


def ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def media_path(*parts):
    return os.path.join(settings.MEDIA_ROOT, *parts)