import random

import bcrypt
import secrets
from datetime import datetime, timezone
import sys
from dateutil.parser import isoparse

if sys.version_info >= (3, 11):
    from datetime import UTC
else:
    from datetime import timezone
    UTC = timezone.utc
from models.User import find_user_by_email, create_user, update_user

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed_password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_otp():
    return str(random.randint(10000, 99999))

def validate_otp(user, otp):
    if not user or user.get('otp') != otp:
        print(f"OTP mismatch: stored_otp={user.get('otp')}, entered_otp={otp}")
        return False
    expiry = user.get('otp_expiry')
    if expiry:
        expiry_dt = isoparse(expiry)  # Parse ISO string back to datetime
        # Log timezone info for debugging
        print(f"Timezone info - now: {datetime.now(UTC).tzinfo}, expiry_dt: {expiry_dt.tzinfo}")
        # Ensure expiry_dt is offset-aware; if it's naive, set it to UTC
        if expiry_dt.tzinfo is None:
            expiry_dt = expiry_dt.replace(tzinfo=UTC)
        if (datetime.now(UTC) - expiry_dt).total_seconds() > 600:  # Both are now offset-aware
            print(f"OTP expired for user {user.get('email')}: expiry={expiry}, now={datetime.now(UTC)}")
            return False
    return True

def create_user_account(email, password, role, profile_data, google_id=None, firebase_uid=None):
    hashed_password = hash_password(password) if password else None

    user = {
        'firebaseUid': firebase_uid,
        'email': email,
        'password': hashed_password,
        'googleId': google_id,
        'role': role,
        'profile': {
            'firstName': profile_data.get('firstName', ''),
            'lastName': profile_data.get('lastName', ''),
            'phone': profile_data.get('phone', ''),
            'address': profile_data.get('address', '')
        },
        'fcmToken': '',
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
    return create_user(user)

def create_doctor_account(email, password, role, profile_data, availability, google_id=None, firebase_uid=None):
    hashed_password = hash_password(password) if password else None
    user = {
        'firebaseUid': firebase_uid,
        'email': email,
        'password': hashed_password,
        'googleId': google_id,
        'role': role,
        'profile': {
            'firstName': profile_data.get('firstName', ''),
            'lastName': profile_data.get('lastName', ''),
            'phone': profile_data.get('phone', ''),
            'address': profile_data.get('address', ''),
            'specialization': profile_data.get('specialization', ''),
            'licenseNumber': profile_data.get('licenseNumber', '')
        },
        'availability': availability,
        'fcmToken': '',
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
    return create_user(user)

