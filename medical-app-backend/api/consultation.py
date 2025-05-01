from flask import Blueprint, request, jsonify, send_file
from middleware.auth_middleware import firebase_auth_required
from middleware.role_middleware import role_required
from services.consultation_service import create_new_consultation, get_consultation, get_doctor_consultations, get_patient_consultations, update_existing_consultation, delete_existing_consultation
from models.User import find_user_by_id
from models.Consultation import find_consultation_by_id, find_consultations_by_appointment
import os

consultation_bp = Blueprint('consultation', __name__)

@consultation_bp.route('/consultations', methods=['POST'])
@firebase_auth_required
@role_required('doctor')
def create_consultation_endpoint():
    if not request.content_type.startswith('multipart/form-data'):
        return jsonify({'error': 'Request must be multipart/form-data'}), 400

    data = request.form.to_dict()
    files = request.files.getlist('files')

    doctor_id = request.user['sub']
    consultation_data = {
        'appointmentId': data.get('appointmentId'),
        'patientId': data.get('patientId'),
        'doctorId': doctor_id,
        'diagnosis': data.get('diagnosis'),
        'prescription': data.get('prescription'),
        'notes': data.get('notes', '')
    }

    required_fields = ['appointmentId', 'patientId', 'diagnosis', 'prescription']
    for field in required_fields:
        if not consultation_data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    consultation, error = create_new_consultation(consultation_data, doctor_id, files)
    if error:
        return jsonify({'error': error}), 400
    return jsonify(consultation), 201
@consultation_bp.route('/consultations/<consultation_id>', methods=['GET'])
@firebase_auth_required
@role_required('doctor')
def get_consultation_endpoint(consultation_id):
    doctor_id = request.user['sub']
    consultation, error = get_consultation(consultation_id, doctor_id)
    if error:
        return jsonify({'error': error}), 404 if error == "Consultation not found" else 403
    return jsonify(consultation), 200

@consultation_bp.route('/consultations/appointment/<appointment_id>', methods=['GET'])
@firebase_auth_required
@role_required('doctor')
def get_consultation_by_appointment_endpoint(appointment_id):
    doctor_id = request.user['sub']
    consultations = find_consultations_by_appointment(appointment_id)
    if not consultations:
        return jsonify({'error': 'Consultation not found'}), 404

    consultation = consultations[0]  
    if consultation['doctorId'] != doctor_id:
        return jsonify({'error': 'Unauthorized: Not your consultation'}), 403

    return jsonify(consultation), 200

@consultation_bp.route('/consultations', methods=['GET'])
@firebase_auth_required
@role_required('doctor')
def get_doctor_consultations_endpoint():
    doctor_id = request.user['sub']
    consultations, error = get_doctor_consultations(doctor_id)
    if error:
        return jsonify({'error': error}), 400
    return jsonify(consultations), 200

@consultation_bp.route('/patient/consultations', methods=['GET'])
@firebase_auth_required
@role_required('patient')
def get_patient_consultations_endpoint():
    patient_id = request.user['sub']
    consultations, error = get_patient_consultations(patient_id, patient_id)
    if error:
        return jsonify({'error': error}), 403
    for consultation in consultations:
        doctor = find_user_by_id(consultation['doctorId'])
        if doctor:
            consultation['doctorName'] = f"{doctor['profile']['firstName']} {doctor['profile']['lastName']}"
        else:
            consultation['doctorName'] = "Unknown Doctor"
    return jsonify(consultations), 200

@consultation_bp.route('/consultations/<consultation_id>', methods=['PUT'])
@firebase_auth_required
@role_required('doctor')
def update_consultation_endpoint(consultation_id):
    data = request.get_json()
    doctor_id = request.user['sub']
    updates = {
        'diagnosis': data.get('diagnosis'),
        'prescription': data.get('prescription'),
        'documents': data.get('documents'),
        'notes': data.get('notes')
    }
    success, error = update_existing_consultation(consultation_id, updates, doctor_id)
    if error:
        return jsonify({'error': error}), 404 if error == "Consultation not found" else 403
    return jsonify({'message': 'Consultation updated successfully'}), 200

@consultation_bp.route('/consultations/<consultation_id>', methods=['DELETE'])
@firebase_auth_required
@role_required('doctor')
def delete_consultation_endpoint(consultation_id):
    doctor_id = request.user['sub']
    success, error = delete_existing_consultation(consultation_id, doctor_id)
    if error:
        return jsonify({'error': error}), 404 if error == "Consultation not found" else 403
    return jsonify({'message': 'Consultation deleted successfully'}), 200

@consultation_bp.route('/consultations/<consultation_id>/documents/<filename>', methods=['GET'])
@firebase_auth_required
@role_required('patient')
def download_document(consultation_id, filename):
    try:
        consultation = find_consultation_by_id(consultation_id)
        if not consultation:
            return jsonify({'error': 'Consultation not found'}), 404

        patient_id = request.user['sub']
        if consultation['patientId'] != patient_id:
            return jsonify({'error': 'Unauthorized: Not your consultation'}), 403

        document = next((doc for doc in consultation['documents'] if doc['filename'] == filename), None)
        if not document:
            return jsonify({'error': 'Document not found'}), 404

        file_path = document['path']
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found on server'}), 404

        return send_file(file_path, as_attachment=True, download_name=document['original_name'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500