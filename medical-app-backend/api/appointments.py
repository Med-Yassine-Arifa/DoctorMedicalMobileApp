from flask import Blueprint, jsonify, request
from middleware.auth_middleware import firebase_auth_required
from middleware.role_middleware import role_required
from models.Appointments import (
    create_appointment, get_appointments_by_doctor, get_appointments_by_patient,
    update_appointment_status, get_appointment_by_id
)
from datetime import datetime, UTC

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/appointments', methods=['POST'])
@firebase_auth_required
@role_required('patient')
def book_appointment():
    try:
        data = request.get_json()
        patient_id = request.user['sub']
        doctor_id = data.get('doctorId')
        date = data.get('date')
        time = data.get('time')
        reason = data.get('reason', '')

        if not all([doctor_id, date, time]):
            return jsonify({'error': 'Missing required fields'}), 400

        appointment_date = f"{date}T{time}:00Z"

        appointment = create_appointment(
            patient_id=patient_id,
            doctor_id=doctor_id,
            date=appointment_date,
            duration=45,
            reason=reason
        )
        return jsonify({'message': 'Appointment request created successfully', 'appointmentId': appointment['id']}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@appointments_bp.route('/appointments/doctor', methods=['GET'])
@firebase_auth_required
@role_required('doctor')
def get_doctor_appointments():
    try:
        doctor_id = request.user['sub']
        status = request.args.get('status', 'pending')
        appointments = get_appointments_by_doctor(doctor_id, status)
        return jsonify(appointments), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appointments_bp.route('/appointments/doctor/<doctor_id>', methods=['GET'])
@firebase_auth_required
@role_required('patient')
def get_appointment_by_doctorId(doctor_id):
    try:
        status_prams = request.args.get('status')
        status_list = status_prams.split(',')

        all_appointments = []
        for status in status_list:
            all_appointments += get_appointments_by_doctor(doctor_id, status)

        return jsonify(all_appointments), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500




@appointments_bp.route('/appointments/patient', methods=['GET'])
@firebase_auth_required
@role_required('patient')
def get_patient_appointments():
    try:
        patient_id = request.user['sub']
        appointments = get_appointments_by_patient(patient_id)
        return jsonify(appointments), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@appointments_bp.route('/appointments/<appointment_id>', methods=['GET'])
@firebase_auth_required
def get_appointment(appointment_id):
    try:
        user_id = request.user['sub']
        user_role = request.user.get('role', '')

        appointment = get_appointment_by_id(appointment_id)
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404

        # Authorization check: Ensure the user is either the patient or the doctor associated with the appointment
        if user_role == 'patient' and appointment['patientId'] != user_id:
            return jsonify({'error': 'Unauthorized: Not your appointment'}), 403
        if user_role == 'doctor' and appointment['doctorId'] != user_id:
            return jsonify({'error': 'Unauthorized: Not your appointment'}), 403

        return jsonify(appointment), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@appointments_bp.route('/appointments/<appointment_id>/status', methods=['PUT'])
@firebase_auth_required
@role_required('doctor')
def update_appointment_status_endpoint(appointment_id):
    try:
        data = request.get_json()
        status = data.get('status')
        if status not in ['confirmed', 'rejected']:
            return jsonify({'error': 'Invalid status'}), 400

        updated = update_appointment_status(appointment_id, status)
        if not updated:
            return jsonify({'error': 'Failed to update appointment status'}), 500

        return jsonify({'message': 'Appointment status updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
