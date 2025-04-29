from bson import ObjectId
from flask import Blueprint, request, jsonify
from firebase_admin import auth
from models.User import find_user_by_email, create_user, update_user, find_user_by_id, update_user_email, db
from services.auth_service import hash_password, check_password, generate_otp, validate_otp, create_user_account, \
    create_doctor_account
from utils.mail import send_otp_email
from middleware.auth_middleware import firebase_auth_required
from middleware.role_middleware import role_required
from datetime import datetime, UTC

auth_bp = Blueprint('auth', __name__)


# Register (Only for Patients)
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = 'patient'
    profile_data = {
        'firstName': data.get('firstName', ''),
        'lastName': data.get('lastName', ''),
        'phone': data.get('phone', ''),
        'address': data.get('address', '')
    }

    if not email or not password:
        return jsonify({'error': 'Invalid input: email and password are required'}), 400

    # Check if the email already exists in MongoDB
    existing_user = find_user_by_email(email)
    if existing_user:
        return jsonify({'error': 'Email already exists in MongoDB'}), 409

    try:
        # Create user in Firebase
        firebase_user = auth.create_user(
            email=email,
            password=password
        )

        # Set custom claim for role
        auth.set_custom_user_claims(firebase_user.uid, {'role': role})


        try:
            # Create user in MongoDB with Firebase UID
            user_data = create_user_account(email, None, role, profile_data, firebase_uid=firebase_user.uid)
        except Exception as e:
            # If MongoDB creation fails, delete the Firebase user
            auth.delete_user(firebase_user.uid)
            return jsonify({'error': f'Failed to create user in MongoDB: {str(e)}'}), 500

        return jsonify({'message': 'User created successfully', 'role': role, 'userId': firebase_user.uid}), 201
    except auth.EmailAlreadyExistsError:
        return jsonify({'error': 'Email already exists in Firebase'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Get User Info
@auth_bp.route('/me', methods=['GET'])
@firebase_auth_required
def get_user_info():
    uid = request.user['sub']
    role = request.user.get('role')
    if not role:
        return jsonify({'error': 'Role not found in token'}), 403
    user = find_user_by_id(uid)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'userId': uid,
        'email': user['email'],
        'role': role,
        'profile': user['profile']
    }), 200


# Google Sign-In
@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    id_token = data.get('idToken')
    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(id_token)
        email = decoded_token['email']
        google_id = decoded_token['sub']

        user = find_user_by_email(email)
        if not user:
            role = 'patient'  # Only patients via Google
            user_data = create_user_account(email, None, role, {}, google_id=google_id, firebase_uid=google_id)
            auth.set_custom_user_claims(google_id, {'role': role})
        else:
            user_data = user

        # Ensure Firebase user exists
        try:
            firebase_user = auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            firebase_user = auth.create_user(email=email)
            db.users.update_one({'email': email}, {'$set': {'firebaseUid': firebase_user.uid}})

        return jsonify({'message': 'Login successful', 'role': user_data['role'], 'userId': firebase_user.uid}), 200
    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid Google token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Forgot Password
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    user = find_user_by_email(email)
    if not user:
        return jsonify({'error': 'Email not found'}), 404

    otp = generate_otp()
    update_user_email(email, {'otp': otp, 'otp_expiry': datetime.now(UTC)})
    send_otp_email(email, otp)
    return jsonify({'message': 'OTP sent to email'}), 200

# OTP Verification
@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    user = find_user_by_email(email)
    if not validate_otp(user, otp):
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    return jsonify({'message': 'OTP verified'}), 200

# Reset Password
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('newPassword')

    user = find_user_by_email(email)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    update_user_email(email, {'otp': None, 'otp_expiry': None})

    try:
        firebase_user = auth.get_user_by_email(email)
        auth.update_user(firebase_user.uid, password=new_password)
    except auth.UserNotFoundError:
        return jsonify({'error': 'User not found in Firebase'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'message': 'Password reset successful'}), 200

# Logout
@auth_bp.route('/logout', methods=['POST'])
@firebase_auth_required
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200