"""
Seed script — creates all demo users, roles, locations, teams and sample patients.
Run: python seed.py
"""

import sys
import os
import base64

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models.models import Base, Role, Location, Team, User, Permission, RolePermission, Patient, PatientUploadBatch
from app.core.security import hash_password
from app.core.encryption import encrypt_patient_record, generate_key
from datetime import datetime, date
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # ── Roles ─────────────────────────────────────────────────────────────
        roles_data = [
            {"name": "admin", "description": "Full system access — manage users, roles, locations, teams"},
            {"name": "manager", "description": "Location-scoped access — manage patients and view team users"},
            {"name": "user", "description": "Basic access — view own profile and dashboard"},
        ]
        roles = {}
        for rd in roles_data:
            role = db.query(Role).filter(Role.name == rd["name"]).first()
            if not role:
                role = Role(**rd)
                db.add(role)
                db.flush()
            roles[rd["name"]] = role
        logger.info("✓ Roles seeded")

        # ── Locations ─────────────────────────────────────────────────────────
        locations_data = [
            {"code": "US", "name": "United States", "timezone": "America/New_York"},
            {"code": "IN", "name": "India",          "timezone": "Asia/Kolkata"},
            {"code": "EU", "name": "Europe",         "timezone": "Europe/London"},
            {"code": "AU", "name": "Australia",      "timezone": "Australia/Sydney"},
        ]
        locations = {}
        for ld in locations_data:
            loc = db.query(Location).filter(Location.code == ld["code"]).first()
            if not loc:
                loc = Location(**ld)
                db.add(loc)
                db.flush()
            locations[ld["code"]] = loc
        logger.info("✓ Locations seeded")

        # ── Teams ─────────────────────────────────────────────────────────────
        teams_data = [
            {"code": "AR",  "name": "Accounts Receivable",     "description": "Handles billing and receivables"},
            {"code": "EPA", "name": "Environmental Protection", "description": "Environmental compliance team"},
            {"code": "PRI", "name": "Priority Team",           "description": "High-priority escalations team"},
        ]
        teams = {}
        for td in teams_data:
            team = db.query(Team).filter(Team.code == td["code"]).first()
            if not team:
                team = Team(**td)
                db.add(team)
                db.flush()
            teams[td["code"]] = team
        logger.info("✓ Teams seeded")

        db.commit()

        # ── Users ─────────────────────────────────────────────────────────────
        users_spec = [
            # Admins
            {"username": "admin",        "email": "admin@healthguard.io",       "full_name": "System Administrator", "password": "Admin@123!", "role": "admin",   "location": "US", "team": "AR"},
            # Managers — one per location
            {"username": "mgr_us",       "email": "mgr.us@healthguard.io",      "full_name": "Alice Johnson",        "password": "Manager@123!", "role": "manager", "location": "US", "team": "PRI"},
            {"username": "mgr_in",       "email": "mgr.in@healthguard.io",      "full_name": "Rajesh Kumar",         "password": "Manager@123!", "role": "manager", "location": "IN", "team": "EPA"},
            {"username": "mgr_eu",       "email": "mgr.eu@healthguard.io",      "full_name": "Sophie Müller",        "password": "Manager@123!", "role": "manager", "location": "EU", "team": "AR"},
            {"username": "mgr_au",       "email": "mgr.au@healthguard.io",      "full_name": "James Wright",         "password": "Manager@123!", "role": "manager", "location": "AU", "team": "PRI"},
            # Users — mix of locations and teams
            {"username": "user_us_ar",   "email": "user.us.ar@healthguard.io",  "full_name": "Bob Smith",            "password": "User@1234!", "role": "user", "location": "US", "team": "AR"},
            {"username": "user_us_epa",  "email": "user.us.epa@healthguard.io", "full_name": "Carol White",          "password": "User@1234!", "role": "user", "location": "US", "team": "EPA"},
            {"username": "user_in_pri",  "email": "user.in.pri@healthguard.io", "full_name": "Priya Sharma",         "password": "User@1234!", "role": "user", "location": "IN", "team": "PRI"},
            {"username": "user_eu_ar",   "email": "user.eu.ar@healthguard.io",  "full_name": "Hans Weber",           "password": "User@1234!", "role": "user", "location": "EU", "team": "AR"},
            {"username": "user_au_epa",  "email": "user.au.epa@healthguard.io", "full_name": "Emma Davis",           "password": "User@1234!", "role": "user", "location": "AU", "team": "EPA"},
            {"username": "user_in_ar",   "email": "user.in.ar@healthguard.io",  "full_name": "Amit Patel",           "password": "User@1234!", "role": "user", "location": "IN", "team": "AR"},
            {"username": "user_eu_pri",  "email": "user.eu.pri@healthguard.io", "full_name": "Marie Dupont",         "password": "User@1234!", "role": "user", "location": "EU", "team": "PRI"},
        ]

        created_users = {}
        for spec in users_spec:
            existing = db.query(User).filter(User.username == spec["username"]).first()
            if not existing:
                user = User(
                    username=spec["username"],
                    email=spec["email"],
                    full_name=spec["full_name"],
                    hashed_password=hash_password(spec["password"]),
                    role_id=roles[spec["role"]].id,
                    location_id=locations[spec["location"]].id,
                    team_id=teams[spec["team"]].id,
                )
                db.add(user)
                db.flush()
                created_users[spec["username"]] = user
            else:
                created_users[spec["username"]] = existing

        db.commit()
        logger.info(f"✓ {len(users_spec)} users seeded")

        # ── Sample Patient Data (for mgr_us) ───────────────────────────────────
        mgr_us = created_users.get("mgr_us")
        if mgr_us:
            existing_batch = db.query(PatientUploadBatch).filter(
                PatientUploadBatch.uploaded_by == mgr_us.id
            ).first()

            if not existing_batch:
                batch = PatientUploadBatch(
                    uploaded_by=mgr_us.id,
                    filename="sample_patients_seed.xlsx",
                    status="completed",
                    total_records=15,
                    successful_records=15,
                    failed_records=0,
                    completed_at=datetime.utcnow(),
                )
                db.add(batch)
                db.flush()

                sample_patients = [
                    ("PT-001", "James",    "Harrison", "1985-03-14", "Male"),
                    ("PT-002", "Emily",    "Chen",     "1992-07-22", "Female"),
                    ("PT-003", "Michael",  "Torres",   "1978-11-05", "Male"),
                    ("PT-004", "Sarah",    "Johnson",  "1990-01-30", "Female"),
                    ("PT-005", "David",    "Williams", "1965-08-17", "Male"),
                    ("PT-006", "Jessica",  "Brown",    "2000-04-09", "Female"),
                    ("PT-007", "Robert",   "Garcia",   "1955-12-25", "Male"),
                    ("PT-008", "Jennifer", "Martinez", "1988-06-11", "Female"),
                    ("PT-009", "William",  "Anderson", "1972-09-03", "Male"),
                    ("PT-010", "Lisa",     "Taylor",   "1995-02-28", "Female"),
                    ("PT-011", "Charles",  "Thomas",   "1983-05-19", "Male"),
                    ("PT-012", "Amanda",   "Jackson",  "1998-10-07", "Female"),
                    ("PT-013", "Mark",     "White",    "1969-07-15", "Male"),
                    ("PT-014", "Stephanie","Harris",   "1975-03-22", "Female"),
                    ("PT-015", "Daniel",   "Clark",    "2003-11-30", "Other"),
                ]

                for pid, fn, ln, dob, gender in sample_patients:
                    record = {"first_name": fn, "last_name": ln, "date_of_birth": dob, "gender": gender}
                    enc = encrypt_patient_record(record)
                    patient = Patient(
                        patient_id=pid,
                        first_name=enc["first_name"],
                        last_name=enc["last_name"],
                        date_of_birth=enc["date_of_birth"],
                        gender=enc["gender"],
                        upload_batch_id=batch.id,
                        uploaded_by=mgr_us.id,
                    )
                    db.add(patient)

                db.commit()
                logger.info("✓ 15 sample patients seeded for mgr_us")

        logger.info("\n=== SEED COMPLETE ===")
        logger.info("Demo credentials:")
        logger.info("  Admin:   admin / Admin@123!")
        logger.info("  Manager: mgr_us / Manager@123! (US location, has sample patients)")
        logger.info("  Manager: mgr_in / Manager@123! (IN location)")
        logger.info("  User:    user_us_ar / User@1234!")

    except Exception as e:
        db.rollback()
        logger.error(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
