import os
import secrets
import base64
from django.conf import settings
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad


def generate_aes_key():
    """
    Generates a cryptographically secure random 32-byte (256-bit) AES key.
    Never hardcoded, never reused.
    """
    return secrets.token_bytes(32)


def generate_iv():
    """
    Generates a random 16-byte IV for AES-CBC mode.
    """
    return secrets.token_bytes(16)


def _get_master_key_bytes():
    """
    Derives a 32-byte key from the AES_MASTER_KEY setting.
    The setting is expected to be a base64-encoded 32-byte value;
    if it isn't valid base64 of the right length, we hash it down
    to 32 bytes so encryption never silently fails on a malformed setting.
    """
    master_key_raw = settings.AES_MASTER_KEY.encode('utf-8')
    try:
        decoded = base64.b64decode(master_key_raw, validate=True)
        if len(decoded) == 32:
            return decoded
    except Exception:
        pass

    import hashlib
    return hashlib.sha256(master_key_raw).digest()


def wrap_aes_key(raw_key: bytes) -> str:
    """
    Encrypts (wraps) the per-file AES key using the AES_MASTER_KEY,
    so only the wrapped value is ever persisted to the database.
    Returns a base64-encoded string containing IV + ciphertext.
    """
    master_key = _get_master_key_bytes()
    iv = generate_iv()
    cipher = AES.new(master_key, AES.MODE_CBC, iv)
    padded = pad(raw_key, AES.block_size)
    ciphertext = cipher.encrypt(padded)
    return base64.b64encode(iv + ciphertext).decode('utf-8')


def unwrap_aes_key(wrapped_key_b64: str) -> bytes:
    """
    Reverses wrap_aes_key — used internally only (e.g. by a future
    decryption phase). Never exposed via any API response.
    """
    master_key = _get_master_key_bytes()
    raw = base64.b64decode(wrapped_key_b64)
    iv, ciphertext = raw[:16], raw[16:]
    cipher = AES.new(master_key, AES.MODE_CBC, iv)
    padded = cipher.decrypt(ciphertext)
    return unpad(padded, AES.block_size)


def encrypt_file(input_path: str, output_path: str, aes_key: bytes) -> str:
    """
    Encrypts the entire file at input_path (never line-by-line) using
    AES-256-CBC with a fresh random IV. Writes IV + ciphertext to
    output_path. Returns the IV as a hex string for storage.
    """
    iv = generate_iv()
    cipher = AES.new(aes_key, AES.MODE_CBC, iv)

    with open(input_path, 'rb') as f:
        plaintext = f.read()

    padded = pad(plaintext, AES.block_size)
    ciphertext = cipher.encrypt(padded)

    with open(output_path, 'wb') as f:
        f.write(ciphertext)

    return iv.hex()


def decrypt_file_to_bytes(encrypted_path: str, aes_key: bytes, iv_hex: str) -> bytes:
    """
    Reserved for Phase 7 (Production decryption). Not called anywhere
    in Phase 6 — included here only because crypto.py is the designated
    home for all encryption primitives per the spec's architecture rule.
    """
    iv = bytes.fromhex(iv_hex)
    cipher = AES.new(aes_key, AES.MODE_CBC, iv)

    with open(encrypted_path, 'rb') as f:
        ciphertext = f.read()

    padded = cipher.decrypt(ciphertext)
    return unpad(padded, AES.block_size)