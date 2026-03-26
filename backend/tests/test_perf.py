"""
Performance benchmarks for AES-256-GCM encryption overhead.

Run:  cd backend && pytest tests/test_perf.py -v -s

These tests assert hard upper bounds to catch regressions.
The -s flag prints the timing table to stdout.
"""

import time
import base64
import pytest


@pytest.fixture(autouse=True)
def set_key(monkeypatch):
    """Inject a deterministic 32-byte test key so no .env is needed."""
    import app.core.config as cfg
    monkeypatch.setattr(cfg.settings, "ENCRYPTION_KEY", base64.b64encode(b"K" * 32).decode())


# ── helpers ────────────────────────────────────────────────────────────────────

def _timeit(fn, iterations: int) -> float:
    """Return average wall-clock time per call in milliseconds."""
    start = time.perf_counter()
    for _ in range(iterations):
        fn()
    return (time.perf_counter() - start) / iterations * 1000


# ── single-field benchmarks ────────────────────────────────────────────────────

class TestFieldEncryptionPerf:
    def test_encrypt_single_field(self):
        from app.core.encryption import encrypt_field
        ms = _timeit(lambda: encrypt_field("John Smith"), iterations=1000)
        print(f"\n  encrypt_field (×1000): {ms:.3f} ms/op")
        assert ms < 5.0, f"Too slow: {ms:.3f} ms"

    def test_decrypt_single_field(self):
        from app.core.encryption import encrypt_field, decrypt_field
        token = encrypt_field("John Smith")
        ms = _timeit(lambda: decrypt_field(token), iterations=1000)
        print(f"\n  decrypt_field (×1000): {ms:.3f} ms/op")
        assert ms < 5.0, f"Too slow: {ms:.3f} ms"

    def test_encrypt_decrypt_roundtrip(self):
        from app.core.encryption import encrypt_field, decrypt_field
        def roundtrip():
            decrypt_field(encrypt_field("Jane Doe"))
        ms = _timeit(roundtrip, iterations=500)
        print(f"\n  roundtrip (×500): {ms:.3f} ms/op")
        assert ms < 10.0, f"Too slow: {ms:.3f} ms"


# ── full patient-record benchmarks ─────────────────────────────────────────────

class TestPatientRecordPerf:
    SAMPLE = {
        "first_name": "Elizabeth",
        "last_name": "Johnson",
        "date_of_birth": "1985-03-14",
        "gender": "Female",
    }

    def test_encrypt_one_record(self):
        from app.core.encryption import encrypt_patient_record
        ms = _timeit(lambda: encrypt_patient_record(self.SAMPLE), iterations=500)
        print(f"\n  encrypt_patient_record (×500): {ms:.3f} ms/op  [{ms*4:.3f} ms total for 4 fields]")
        assert ms < 20.0, f"Too slow: {ms:.3f} ms"

    def test_decrypt_one_record(self):
        from app.core.encryption import encrypt_patient_record, decrypt_patient_record
        enc = encrypt_patient_record(self.SAMPLE)
        ms = _timeit(lambda: decrypt_patient_record(enc), iterations=500)
        print(f"\n  decrypt_patient_record (×500): {ms:.3f} ms/op")
        assert ms < 20.0, f"Too slow: {ms:.3f} ms"


# ── bulk-record benchmarks ─────────────────────────────────────────────────────

class TestBulkEncryptionPerf:
    def _make_records(self, n: int):
        genders = ["Male", "Female", "Other", "Prefer not to say"]
        return [
            {
                "first_name": f"First{i}",
                "last_name": f"Last{i}",
                "date_of_birth": "1990-06-15",
                "gender": genders[i % 4],
            }
            for i in range(n)
        ]

    def test_encrypt_100_records(self):
        from app.core.encryption import encrypt_patient_record
        records = self._make_records(100)
        t0 = time.perf_counter()
        encrypted = [encrypt_patient_record(r) for r in records]
        elapsed_ms = (time.perf_counter() - t0) * 1000
        print(f"\n  encrypt 100 records: {elapsed_ms:.1f} ms total  ({elapsed_ms/100:.2f} ms/record)")
        assert len(encrypted) == 100
        assert elapsed_ms < 2000, f"Too slow: {elapsed_ms:.0f} ms"

    def test_encrypt_1000_records(self):
        from app.core.encryption import encrypt_patient_record
        records = self._make_records(1000)
        t0 = time.perf_counter()
        encrypted = [encrypt_patient_record(r) for r in records]
        elapsed_ms = (time.perf_counter() - t0) * 1000
        print(f"\n  encrypt 1000 records: {elapsed_ms:.1f} ms total  ({elapsed_ms/1000:.2f} ms/record)")
        assert len(encrypted) == 1000
        assert elapsed_ms < 20_000, f"Too slow: {elapsed_ms:.0f} ms"

    def test_decrypt_1000_records(self):
        from app.core.encryption import encrypt_patient_record, decrypt_patient_record
        records = self._make_records(1000)
        encrypted = [encrypt_patient_record(r) for r in records]
        t0 = time.perf_counter()
        decrypted = [decrypt_patient_record(r) for r in encrypted]
        elapsed_ms = (time.perf_counter() - t0) * 1000
        print(f"\n  decrypt 1000 records: {elapsed_ms:.1f} ms total  ({elapsed_ms/1000:.2f} ms/record)")
        # Verify correctness
        assert decrypted[0]["first_name"] == "First0"
        assert decrypted[999]["last_name"] == "Last999"
        assert elapsed_ms < 20_000, f"Too slow: {elapsed_ms:.0f} ms"

    def test_encrypt_decrypt_10k_records_throughput(self):
        """
        Simulates a full 10,000-record upload (encrypt) + display page (decrypt 20 records).
        Asserts the upload completes within a reasonable wall-clock budget.
        """
        from app.core.encryption import encrypt_patient_record, decrypt_patient_record
        records = self._make_records(10_000)

        t0 = time.perf_counter()
        encrypted = [encrypt_patient_record(r) for r in records]
        enc_ms = (time.perf_counter() - t0) * 1000

        # Simulate a page load — decrypt just 20 records
        t1 = time.perf_counter()
        [decrypt_patient_record(r) for r in encrypted[:20]]
        dec_page_ms = (time.perf_counter() - t1) * 1000

        print(
            f"\n  10 000-record upload encrypt: {enc_ms:.0f} ms  ({enc_ms/10_000:.2f} ms/record)"
            f"\n  page decrypt (20 records):    {dec_page_ms:.2f} ms"
        )
        assert enc_ms < 200_000, f"10k encrypt too slow: {enc_ms:.0f} ms"
        assert dec_page_ms < 500, f"Page decrypt too slow: {dec_page_ms:.1f} ms"
