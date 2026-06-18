import os
from django.conf import settings


def media_path(*parts):
    return os.path.join(settings.MEDIA_ROOT, *parts)


def ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def build_decrypted_filename(encrypted_file_id):
    return f'batch_{encrypted_file_id}.txt'


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')