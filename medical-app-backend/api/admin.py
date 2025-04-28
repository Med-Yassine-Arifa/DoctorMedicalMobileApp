from flask import Blueprint, request, jsonify
from firebase_admin import auth
from models.User import find_user_by_email, find_user_by_id, get_all_doctors, update_user, delete_user
from middleware.auth_middleware import firebase_auth_required
from middleware.role_middleware import role_required
from services.auth_service import create_doctor_account
from datetime import datetime, UTC

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/create-doctor', methods=['POST'])
@firebase_auth_required
@role_required('admin')
def create_doctor():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = 'doctor'
    profile_data = {
        'firstName': data.get('firstName', ''),
        'lastName': data.get('lastName', ''),
        'phone': data.get('phone', ''),
        'address': data.get('address', ''),
        'specialization': data.get('specialization', ''),
        'licenseNumber': data.get('licenseNumber', '')
    }
    availability = data.get('availability', [])

    if not email or not password or not profile_data['firstName'] or not profile_data['lastName']:
        return jsonify({'error': 'Email, password, firstName, and lastName are required'}), 400

    for slot in availability:
        if not all(key in slot for key in ['day', 'startTime', 'endTime']):
            return jsonify({'error': 'Invalid availability format'}), 400

    if find_user_by_email(email):
        return jsonify({'error': 'Email already exists in MongoDB'}), 409

    try:
        try:
            auth.get_user_by_email(email)
            return jsonify({'error': 'Email already exists in Firebase'}), 409
        except auth.UserNotFoundError:
            pass

        firebase_user = auth.create_user(email=email, password=password)
        auth.set_custom_user_claims(firebase_user.uid, {'role': role})

        try:
            doctor = create_doctor_account(email, None, role, profile_data, availability, firebase_uid=firebase_user.uid)
        except Exception as e:
            auth.delete_user(firebase_user.uid)
            return jsonify({'error': f'Failed to create doctor in MongoDB: {str(e)}'}), 500

        return jsonify({'message': 'Doctor created successfully', 'role': role, 'doctorId': firebase_user.uid}), 201
    except auth.EmailAlreadyExistsError:
        return jsonify({'error': 'Email already exists in Firebase'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/doctors', methods=['GET'])
@firebase_auth_required
@role_required('admin')
def get_doctors():
    doctors = get_all_doctors()
    return jsonify(doctors), 200

@admin_bp.route('/doctors/<doctor_id>', methods=['GET'])
@firebase_auth_required
@role_required('admin')
def get_doctor(doctor_id):
    doctor = find_user_by_id(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    return jsonify(doctor), 200

@admin_bp.route('/doctors/<doctor_id>', methods=['PUT'])
@firebase_auth_required
@role_required('admin')
def update_doctor(doctor_id):
    data = request.get_json()
    doctor = find_user_by_id(doctor_id)

    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404

    if 'email' in data and data['email'] != doctor['email']:
        if find_user_by_email(data['email']):
            return jsonify({'error': 'Email already exists'}), 409

    try:
        if 'email' in data or 'password' in data:
            firebase_user = auth.get_user(doctor_id)
            update_args = {}
            if 'email' in data:
                update_args['email'] = data['email']
            if 'password' in data:
                update_args['password'] = data['password']
            if update_args:
                auth.update_user(firebase_user.uid, **update_args)

        updated = update_user(doctor_id, data)
        if not updated:
            return jsonify({'error': 'Failed to update doctor'}), 500

        return jsonify({'message': 'Doctor updated successfully'}), 200
    except auth.UserNotFoundError:
        return jsonify({'error': 'Doctor not found in Firebase'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/doctors/<doctor_id>', methods=['DELETE'])
@firebase_auth_required
@role_required('admin')
def delete_doctor(doctor_id):
    doctor = find_user_by_id(doctor_id)

    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404

    try:
        try:
            auth.delete_user(doctor_id)
        except auth.UserNotFoundError:
            pass

        deleted = delete_user(doctor_id)
        if not deleted:
            return jsonify({'error': 'Failed to delete doctor from database'}), 500

        return jsonify({'message': 'Doctor deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500