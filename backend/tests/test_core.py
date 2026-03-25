"""
Unit tests for HealthGuard backend.
Run: cd backend && pytest tests/ -v
"""

import pytest
import sys
import os
import base64

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Security tests ─────────────────────────────────────────────────────────────

class TestPasswordSecurity:
    def test_hash_and_verify(self):
        from app.core.security import hash_password, verify_password
        pw = "TestPass@123"
        hashed = hash_password(pw)
        assert hashed != pw
        assert verify_password(pw, hashed)
        assert not verify_password("wrong", hashed)

    def test_different_hashes(self):
        from app.core.security import hash_password
        h1 = hash_password("Same@Pass1")
        h2 = hash_password("Same@Pass1")
        assert h1 != h2  # bcrypt uses random salt

    @pytest.mark.parametrize("password,expected_valid", [
        ("short",      False),   # too short
        ("alllowercase1!", False),  # no uppercase
        ("ALLUPPERCASE1!", False),  # no lowercase
        ("NoDigitsHere!", False),   # no digit
        ("NoSpecial123",  False),   # no special char
        ("Valid@Pass1",   True),    # all requirements met
        ("Str0ng!Pass",   True),
    ])
    def test_password_strength(self, password, expected_valid):
        from app.core.security import validate_password_strength
        valid, msg = validate_password_strength(password)
        assert valid == expected_valid, f"'{password}': expected {expected_valid}, got {valid}: {msg}"


class TestJWT:
    def test_create_and_decode(self):
        from app.core.security import create_access_token, decode_token
        token = create_access_token({"sub": "42", "role": "admin"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "42"
        assert payload["role"] == "admin"
        assert payload["type"] == "access"

    def test_refresh_token_type(self):
        from app.core.security import create_refresh_token, decode_token
        token = create_refresh_token({"sub": "7"})
        payload = decode_token(token)
        assert payload["type"] == "refresh"

    def test_invalid_token(self):
        from app.core.security import decode_token
        assert decode_token("not.a.valid.token") is None
        assert decode_token("") is None


# ── Encryption tests ───────────────────────────────────────────────────────────

class TestEncryption:
    @pytest.fixture(autouse=True)
    def set_key(self, monkeypatch):
        """Inject a test encryption key."""
        import app.core.config as cfg
        test_key = base64.b64encode(b"A" * 32).decode()
        monkeypatch.setattr(cfg.settings, "ENCRYPTION_KEY", test_key)

    def test_encrypt_decrypt_roundtrip(self):
        from app.core.encryption import encrypt_field, decrypt_field
        plaintext = "John"
        encrypted = encrypt_field(plaintext)
        assert encrypted != plaintext
        assert decrypt_field(encrypted) == plaintext

    def test_different_ivs(self):
        """Same plaintext must produce different ciphertext (random IV)."""
        from app.core.encryption import encrypt_field
        e1 = encrypt_field("Alice")
        e2 = encrypt_field("Alice")
        assert e1 != e2

    def test_none_passthrough(self):
        from app.core.encryption import encrypt_field, decrypt_field
        assert encrypt_field(None) is None
        assert decrypt_field(None) is None

    def test_encrypt_patient_record(self):
        from app.core.encryption import encrypt_patient_record, decrypt_patient_record
        record = {
            "first_name": "Jane",
            "last_name": "Doe",
            "date_of_birth": "1990-05-15",
            "gender": "Female",
        }
        encrypted = encrypt_patient_record(record)
        # All PHI fields should be encrypted (not equal to plaintext)
        for field in ["first_name", "last_name", "date_of_birth", "gender"]:
            assert encrypted[field] != record[field], f"{field} should be encrypted"
        # Decrypt and compare
        decrypted = decrypt_patient_record(encrypted)
        for field in record:
            assert decrypted[field] == record[field], f"{field} should decrypt correctly"

    def test_generate_key_length(self):
        from app.core.encryption import generate_key
        key_b64 = generate_key()
        key_bytes = base64.b64decode(key_b64)
        assert len(key_bytes) == 32, "AES-256 key must be exactly 32 bytes"

    def test_wrong_key_fails(self, monkeypatch):
        """Decrypting with the wrong key must raise an error."""
        import app.core.config as cfg
        from app.core.encryption import encrypt_field
        key1 = base64.b64encode(b"A" * 32).decode()
        monkeypatch.setattr(cfg.settings, "ENCRYPTION_KEY", key1)
        encrypted = encrypt_field("secret")

        key2 = base64.b64encode(b"B" * 32).decode()
        monkeypatch.setattr(cfg.settings, "ENCRYPTION_KEY", key2)
        from app.core.encryption import decrypt_field
        with pytest.raises(Exception):
            decrypt_field(encrypted)


# ── Schema validation tests ────────────────────────────────────────────────────

class TestPatientSchema:
    @pytest.mark.parametrize("pid,valid", [
        ("PT-001",   True),
        ("ABC123",   True),
        ("",         False),
        ("has space",False),
        ("a" * 51,   False),  # too long
    ])
    def test_patient_id_validation(self, pid, valid):
        from app.schemas.schemas import PatientCreate
        from pydantic import ValidationError
        data = {"patient_id": pid, "first_name": "A", "last_name": "B",
                "date_of_birth": "1990-01-01", "gender": "Male"}
        if valid:
            obj = PatientCreate(**data)
            assert obj.patient_id == pid
        else:
            with pytest.raises(ValidationError):
                PatientCreate(**data)

    @pytest.mark.parametrize("gender,valid", [
        ("Male",   True), ("Female", True), ("Other", True),
        ("Prefer not to say", True), ("Unknown", False), ("M", False),
    ])
    def test_gender_validation(self, gender, valid):
        from app.schemas.schemas import PatientCreate
        from pydantic import ValidationError
        data = {"patient_id": "PT-X", "first_name": "A", "last_name": "B",
                "date_of_birth": "1990-01-01", "gender": gender}
        if valid:
            PatientCreate(**data)
        else:
            with pytest.raises(ValidationError):
                PatientCreate(**data)

    @pytest.mark.parametrize("dob,valid", [
        ("1990-01-15", True), ("2000-12-31", True),
        ("01/15/1990", False), ("1990-13-01", False),  # bad month
        ("not-a-date", False),
    ])
    def test_dob_validation(self, dob, valid):
        from app.schemas.schemas import PatientCreate
        from pydantic import ValidationError
        data = {"patient_id": "PT-X", "first_name": "A", "last_name": "B",
                "date_of_birth": dob, "gender": "Male"}
        if valid:
            PatientCreate(**data)
        else:
            with pytest.raises(ValidationError):
                PatientCreate(**data)
