from flask import Blueprint, request, jsonify
from firebase_admin import auth

from api.auth import auth_bp
from models.User import find_user_by_email, find_user_by_id, get_all_doctors, update_user, delete_user, \
    users_collection, db
from middleware.auth_middleware import firebase_auth_required
from middleware.role_middleware import role_required
from datetime import datetime
import bcrypt

from services.auth_service import create_doctor_account

admin_bp = Blueprint('admin', __name__)


@auth_bp.route('/create-doctor', methods=['POST'])
@firebase_auth_required
@role_required('admin')
def create_doctor():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = 'doctor'  # Hardcode role to 'doctor'
    profile_data = {
        'firstName': data.get('firstName', ''),
        'lastName': data.get('lastName', ''),
        'phone': data.get('phone', ''),
        'address': data.get('address', ''),
        'specialization': data.get('specialization', ''),
        'licenseNumber': data.get('licenseNumber', '')
    }
    availability = data.get('availability', [])  # List of {day, startTime, endTime}

    # Validate input
    if not email or not password or not profile_data['firstName'] or not profile_data['lastName']:
        return jsonify({'error': 'Invalid input: email, password, firstName, and lastName are required'}), 400

    # Validate availability format
    for slot in availability:
        if not all(key in slot for key in ['day', 'startTime', 'endTime']):
            return jsonify({'error': 'Invalid availability format'}), 400

    # Check if email already exists in MongoDB
    if find_user_by_email(email):
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
            # Create doctor in MongoDB with Firebase UID
            doctor = create_doctor_account(email, password, role, profile_data, availability, firebase_uid=firebase_user.uid)
        except Exception as e:
            # If MongoDB creation fails, delete the Firebase user to avoid orphaned users
            auth.delete_user(firebase_user.uid)
            return jsonify({'error': f'Failed to create doctor in MongoDB: {str(e)}'}), 500

        return jsonify({'message': 'Doctor created successfully', 'role': role, 'doctorId': firebase_user.uid}), 201
    except auth.EmailAlreadyExistsError:
        return jsonify({'error': 'Email already exists in Firebase'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get all doctors
@admin_bp.route('/doctors', methods=['GET'])
@firebase_auth_required
@role_required('admin')
def get_doctors():
    doctors = get_all_doctors()
    return jsonify(doctors), 200


# Get doctor by ID
@admin_bp.route('/doctors/<doctor_id>', methods=['GET'])
@firebase_auth_required
@role_required('admin')
def get_doctor(doctor_id):
    doctor = find_user_by_id(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    return jsonify(doctor), 200


# Update doctor
@admin_bp.route('/doctors/<doctor_id>', methods=['PUT'])
@firebase_auth_required
@role_required('admin')
def update_doctor(doctor_id):
    data = request.get_json()
    doctor = find_user_by_id(doctor_id)

    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404

    # Check if email is being changed and if it already exists
    if 'email' in data and data['email'] != doctor['email']:
        existing_user = find_user_by_email(data['email'])
        if existing_user and existing_user['id'] != doctor_id:
            return jsonify({'error': 'Email already exists'}), 409

    try:
        # Update in Firebase if email or password is changed
        if 'email' in data or 'password' in data:
            firebase_user = auth.get_user_by_email(doctor['email'])
            update_args = {}

            if 'email' in data:
                update_args['email'] = data['email']

            if 'password' in data:
                update_args['password'] = data['password']

                # Hash the password for MongoDB storage
                data['password'] = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            if update_args:
                auth.update_user(firebase_user.uid, **update_args)

        # Update in MongoDB
        updated = update_user(doctor_id, data)
        if not updated:
            return jsonify({'error': 'Failed to update doctor'}), 500

        return jsonify({'message': 'Doctor updated successfully'}), 200
    except auth.UserNotFoundError:
        return jsonify({'error': 'Doctor not found in Firebase'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Delete doctor
@admin_bp.route('/doctors/<doctor_id>', methods=['DELETE'])
@firebase_auth_required
@role_required('admin')
def delete_doctor(doctor_id):
    doctor = find_user_by_id(doctor_id)

    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404

    try:
        # Delete from Firebase
        firebase_user = auth.get_user_by_email(doctor['email'])
        auth.delete_user(firebase_user.uid)

        # Delete from MongoDB
        deleted = delete_user(doctor_id)
        if not deleted:
            return jsonify({'error': 'Failed to delete doctor from database'}), 500

        return jsonify({'message': 'Doctor deleted successfully'}), 200
    except auth.UserNotFoundError:
        # If not in Firebase, just delete from MongoDB
        deleted = delete_user(doctor_id)
        if not deleted:
            return jsonify({'error': 'Failed to delete doctor from database'}), 500

        return jsonify({'message': 'Doctor deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
