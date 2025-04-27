from functools import wraps
from flask import jsonify, request
from models.User import find_user_by_email

def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not hasattr(request, 'user'):
                return jsonify({'error': 'User not authenticated'}), 401

            email = request.user['email']
            uid = request.user['sub']  # Firebase UID is in the 'sub' field
            user = find_user_by_email(email)
            if not user:
                print(f"User not found in MongoDB: {email}")
                return jsonify({'error': 'User not found'}), 404

            if user.get('firebaseUid') != uid:
                print(f"UID mismatch for {email}: Firebase UID={uid}, MongoDB firebaseUid={user.get('firebaseUid')}")
                return jsonify({'error': 'UID mismatch'}), 401

            if user['role'] != role:
                print(f"Role mismatch for {email}: Required={role}, Found={user['role']}")
                return jsonify({'error': 'Unauthorized: Incorrect role'}), 403

            return f(*args, **kwargs)
        return wrapper
    return decorator