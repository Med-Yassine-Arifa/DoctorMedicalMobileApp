from flask import Blueprint, jsonify, request
from firebase_admin import auth
from middleware.auth_middleware import firebase_auth_required
from middleware.role_middleware import role_required
from models.User import get_all_doctors, find_user_by_id

patient_bp = Blueprint('patient', __name__)

# Get all doctors (for patient dashboard and doctors list)
@patient_bp.route('/doctors', methods=['GET'])
@firebase_auth_required
@role_required('patient')
def get_doctors():
    doctors = get_all_doctors()
    return jsonify(doctors), 200

# Get doctor by ID (for potential future use, e.g., viewing doctor details)
@patient_bp.route('/doctors/<doctor_id>', methods=['GET'])
@firebase_auth_required
@role_required('patient')
def get_doctor(doctor_id):
    doctor = find_user_by_id(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    return jsonify(doctor), 200