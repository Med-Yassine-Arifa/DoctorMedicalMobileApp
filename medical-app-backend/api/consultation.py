from flask import Blueprint, request, jsonify
from middleware.auth_middleware import firebase_auth_required
from middleware.role_middleware import role_required
from services.consultation_service import create_new_consultation, get_consultation, get_doctor_consultations, get_patient_consultations, update_existing_consultation, delete_existing_consultation
from models.User import find_user_by_id

consultation_bp = Blueprint('consultation', __name__)

@consultation_bp.route('/consultations', methods=['POST'])
@firebase_auth_required
@role_required('doctor')
def create_consultation_endpoint():
    # Check if the request has form data (multipart/form-data)
    if not request.content_type.startswith('multipart/form-data'):
        return jsonify({'error': 'Request must be multipart/form-data'}), 400

    # Extract JSON data and files
    data = request.form.to_dict()
    files = request.files.getlist('files')  # Expecting a field named 'files' for uploads

    doctor_id = request.user['sub']
    consultation_data = {
        'appointmentId': data.get('appointmentId'),
        'patientId': data.get('patientId'),
        'doctorId': doctor_id,
        'diagnosis': data.get('diagnosis'),
        'prescription': data.get('prescription'),
        'notes': data.get('notes', '')
    }

    # Validate required fields
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
    # Fetch doctor details for each consultation
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