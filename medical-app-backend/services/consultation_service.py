from models.Consultation import create_consultation, find_consultation_by_id, find_consultations_by_doctor, find_consultations_by_patient, update_consultation, delete_consultation
from models.User import find_user_by_id

def validate_consultation_data(data, doctor_id):
    required_fields = ['appointmentId', 'patientId', 'diagnosis', 'prescription']
    for field in required_fields:
        if field not in data or not data[field]:
            return False, f"Missing or invalid {field}"
    if data['doctorId'] != doctor_id:
        return False, "Unauthorized: Doctor ID mismatch"
    # Verify patient and doctor exist
    if not find_user_by_id(data['patientId']):
        return False, "Patient not found"
    if not find_user_by_id(data['doctorId']):
        return False, "Doctor not found"
    return True, None

def create_new_consultation(consultation_data, doctor_id, uploaded_files=None):
    print(f"Creating new consultation with data: {consultation_data}") # Debug log
    is_valid, error = validate_consultation_data(consultation_data, doctor_id)
    if not is_valid:
        return None, error
    consultation = create_consultation(consultation_data, uploaded_files)
    if not consultation:
        return None, "Failed to create consultation"
    return consultation, None

def get_consultation(consultation_id, doctor_id):
    print(f"Fetching consultation ID: {consultation_id}") # Debug log
    consultation = find_consultation_by_id(consultation_id)
    if not consultation:
        return None, "Consultation not found"
    if consultation['doctorId'] != doctor_id:
        return None, "Unauthorized: Not your consultation"
    return consultation, None

def get_doctor_consultations(doctor_id):
    print(f"Fetching consultations for doctor: {doctor_id}") # Debug log
    consultations = find_consultations_by_doctor(doctor_id)
    return consultations, None

def get_patient_consultations(patient_id, requesting_user_id):
    print(f"Fetching consultations for patient: {patient_id}") # Debug log
    if patient_id != requesting_user_id:
        return None, "Unauthorized: You can only view your own consultations"
    consultations = find_consultations_by_patient(patient_id)
    return consultations, None

def update_existing_consultation(consultation_id, updates, doctor_id):
    print(f"Updating consultation ID: {consultation_id} with updates: {updates}") # Debug log
    consultation = find_consultation_by_id(consultation_id)
    if not consultation:
        return False, "Consultation not found"
    if consultation['doctorId'] != doctor_id:
        return False, "Unauthorized: Not your consultation"
    success = update_consultation(consultation_id, updates)
    if not success:
        return False, "Failed to update consultation"
    return True, None

def delete_existing_consultation(consultation_id, doctor_id):
    print(f"Deleting consultation ID: {consultation_id}") # Debug log
    consultation = find_consultation_by_id(consultation_id)
    if not consultation:
        return False, "Consultation not found"
    if consultation['doctorId'] != doctor_id:
        return False, "Unauthorized: Not your consultation"
    success = delete_consultation(consultation_id)
    if not success:
        return False, "Failed to delete consultation"
    return True, None