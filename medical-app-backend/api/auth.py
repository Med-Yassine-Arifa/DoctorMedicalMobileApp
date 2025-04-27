from bson import ObjectId
from flask import Blueprint, request, jsonify
from firebase_admin import auth
from models.User import find_user_by_email, create_user, update_user, find_user_by_id, update_user_email, db
from services.auth_service import hash_password, check_password, generate_otp, validate_otp, create_user_account, create_doctor_account
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
        # Check if the email already exists in Firebase
        try:
            firebase_user = auth.get_user_by_email(email)
            return jsonify({'error': 'Email already exists in Firebase'}), 409
        except auth.UserNotFoundError:
            # Email does not exist in Firebase, proceed with creation
            pass

        # Create user in Firebase
        firebase_user = auth.create_user(
            email=email,
            password=password,
            display_name=role
        )

        try:
            # Create user in MongoDB with Firebase UID
            user_data = create_user_account(email, password, role, profile_data, firebase_uid=firebase_user.uid)
        except Exception as e:
            # If MongoDB creation fails, delete the Firebase user to avoid orphaned users
            auth.delete_user(firebase_user.uid)
            return jsonify({'error': f'Failed to create user in MongoDB: {str(e)}'}), 500

        return jsonify({'message': 'User created successfully', 'role': role, 'userId': firebase_user.uid}), 201
    except auth.EmailAlreadyExistsError:
        return jsonify({'error': 'Email already exists in Firebase'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Login (Email/Password)
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    print(f"Login attempt for email: {email}")

    user = find_user_by_email(email)
    if not user:
        print(f"User not found in MongoDB: {email}")
        return jsonify({'error': 'Invalid credentials'}), 401

    print(f"User found in MongoDB: {user['email']}, role: {user['role']}")

    if not check_password(password, user['password']):
        print(f"Password verification failed for user: {email}")
        return jsonify({'error': 'Invalid credentials'}), 401

    print(f"Password verification successful for user: {email}")

    try:
        firebase_user = auth.get_user_by_email(email)
        print(f"Firebase user found: {firebase_user.uid}")
        # Generate a custom token for the frontend to use
        custom_token = auth.create_custom_token(firebase_user.uid)
        return jsonify({
            'message': 'Login successful',
            'role': user['role'],
            'userId': firebase_user.uid,
            'token': custom_token.decode('utf-8')
        }), 200
    except auth.UserNotFoundError:
        print(f"User not found in Firebase: {email}")
        return jsonify({'error': 'User not found in Firebase'}), 404
    except Exception as e:
        print(f"Error during login: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Google Sign-In
@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    id_token = data.get('idToken')
    print(f"Received ID token for Google Sign-In: {id_token}")  # Log the received token

    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(id_token)
        print(f"Decoded token: {decoded_token}")  # Log the decoded token for debugging
        email = decoded_token['email']
        google_id = decoded_token['sub']  # Use 'sub' instead of 'uid'

        user = find_user_by_email(email)
        if not user:
            role = decoded_token.get('display_name', 'patient')
            if role not in ['patient', 'doctor', 'admin']:
                role = 'patient'  # Default to patient if role is invalid
            if role == 'patient':
                user_data = create_user_account(email, None, role, {}, google_id=google_id,
                                                firebase_uid=decoded_token['sub'])
                print(f"Created new user in MongoDB: {email}")
            else:
                print(f"Role {role} not allowed for Google Sign-In")
                return jsonify({'error': 'Only patients can be registered via Google Sign-In'}), 403
        else:
            user_data = user
            print(f"User already exists in MongoDB: {email}")

        # Ensure the user exists in Firebase
        try:
            firebase_user = auth.get_user_by_email(email)
            print(f"Firebase user found: {firebase_user.uid}")
        except auth.UserNotFoundError:
            print(f"Firebase user not found, creating: {email}")
            firebase_user = auth.create_user(
                email=email,
                display_name=user_data['role']
            )
            # Update MongoDB with Firebase UID
            db.users.update_one({'email': email}, {'$set': {'firebaseUid': firebase_user.uid}})
            print(f"Updated MongoDB with firebaseUid: {firebase_user.uid}")

        return jsonify({'message': 'Login successful', 'role': user_data['role'], 'userId': firebase_user.uid}), 200
    except auth.InvalidIdTokenError as e:
        print(f"Invalid ID token error: {str(e)}")  # Log the specific error
        return jsonify({'error': 'Invalid Google token'}), 401
    except Exception as e:
        print(f"Unexpected error during Google Sign-In: {str(e)}")
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

    hashed_password = hash_password(new_password)
    update_user_email(email, {'password': hashed_password, 'otp': None, 'otp_expiry': None})

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