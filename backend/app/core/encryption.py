"""
Application-level AES-256-GCM encryption for PHI (Protected Health Information).

Design decisions:
- AES-256-GCM: authenticated encryption (confidentiality + integrity)
- Per-field encryption: each field encrypted individually with unique IV
- Patient ID left unencrypted: used as DB index/lookup key; a pseudonymous
  identifier that carries no direct PHI — justified per HIPAA safe harbor
- Key stored in environment variable; rotation strategy documented in README
"""

import os
import base64
import logging
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

logger = logging.getLogger(__name__)

_IV_LENGTH = 12   # 96-bit IV recommended for GCM
_TAG_LENGTH = 16  # 128-bit auth tag (GCM default)


def _get_key() -> bytes:
    """Load AES-256 key (32 bytes) from settings."""
    key_b64 = settings.ENCRYPTION_KEY
    if not key_b64:
        raise RuntimeError("ENCRYPTION_KEY not set in environment")
    key = base64.b64decode(key_b64)
    if len(key) != 32:
        raise RuntimeError(f"ENCRYPTION_KEY must be 32 bytes; got {len(key)}")
    return key


def generate_key() -> str:
    """Generate a new AES-256 key and return as base64 string (for setup)."""
    return base64.b64encode(os.urandom(32)).decode()


def encrypt_field(plaintext: str) -> str:
    """
    Encrypt a single string field.
    Returns base64(IV + ciphertext+tag) for compact DB storage.
    """
    if plaintext is None:
        return None
    try:
        key = _get_key()
        aesgcm = AESGCM(key)
        iv = os.urandom(_IV_LENGTH)
        ciphertext = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
        # Prepend IV so we can decrypt later
        combined = iv + ciphertext
        return base64.b64encode(combined).decode("utf-8")
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise


def decrypt_field(ciphertext_b64: str) -> str:
    """
    Decrypt a single field previously encrypted with encrypt_field.
    Returns original plaintext string.
    """
    if ciphertext_b64 is None:
        return None
    try:
        key = _get_key()
        aesgcm = AESGCM(key)
        combined = base64.b64decode(ciphertext_b64)
        iv = combined[:_IV_LENGTH]
        ciphertext = combined[_IV_LENGTH:]
        plaintext = aesgcm.decrypt(iv, ciphertext, None)
        return plaintext.decode("utf-8")
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        raise


def encrypt_patient_record(record: dict) -> dict:
    """Encrypt all PHI fields in a patient record dict."""
    encrypted = record.copy()
    phi_fields = ["first_name", "last_name", "date_of_birth", "gender"]
    for field in phi_fields:
        if field in encrypted and encrypted[field] is not None:
            encrypted[field] = encrypt_field(str(encrypted[field]))
    return encrypted


def decrypt_patient_record(record: dict) -> dict:
    """Decrypt all PHI fields in a patient record dict."""
    decrypted = record.copy()
    phi_fields = ["first_name", "last_name", "date_of_birth", "gender"]
    for field in phi_fields:
        if field in decrypted and decrypted[field] is not None:
            decrypted[field] = decrypt_field(decrypted[field])
    return decrypted
