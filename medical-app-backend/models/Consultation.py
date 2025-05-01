from bson import ObjectId
from pymongo import MongoClient
from datetime import datetime, UTC
import os

client = MongoClient('mongodb+srv://arifamohamedyassine1234:YHSnqgUTa1E20ngU@medicalapp.ndeyixq.mongodb.net/')
db = client['medical_app']
consultations_collection = db['Consultation']

# Define a directory to store uploaded files
UPLOAD_DIR = "uploads/consultation_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def create_consultation(consultation_data, uploaded_files=None):
    try:
        # Handle file uploads if provided
        documents = []
        if uploaded_files:
            for file in uploaded_files:
                # Generate a unique filename to avoid collisions
                filename = f"{datetime.now(UTC).timestamp()}_{file.filename}"
                file_path = os.path.join(UPLOAD_DIR, filename)
                # Save the file to the server
                file.save(file_path)
                # Store file metadata
                documents.append({
                    "filename": filename,
                    "original_name": file.filename,
                    "path": file_path,
                    "uploaded_at": datetime.now(UTC).isoformat()
                })

        consultation = {
            'appointmentId': consultation_data['appointmentId'],
            'patientId': consultation_data['patientId'],
            'doctorId': consultation_data['doctorId'],
            'diagnosis': consultation_data['diagnosis'],
            'prescription':  consultation_data['prescription'],
            'documents': documents,  # Store file metadata
            'notes': consultation_data.get('notes', ''),
            'createdAt': datetime.now(UTC),
            'updatedAt': datetime.now(UTC)
        }
        result = consultations_collection.insert_one(consultation)
        consultation['_id'] = str(result.inserted_id)
        return consultation
    except Exception as e:
        print(f"Error creating consultation: {e}")
        return None

def find_consultation_by_id(consultation_id):
    try:
        consultation = consultations_collection.find_one({'_id': ObjectId(consultation_id)})
        if consultation:
            consultation['_id'] = str(consultation['_id'])
            consultation['createdAt'] = consultation['createdAt'].isoformat()
            consultation['updatedAt'] = consultation['updatedAt'].isoformat()
            return consultation
        return None
    except Exception as e:
        print(f"Error finding consultation: {e}")
        return None

def find_consultations_by_doctor(doctor_id):
    try:
        consultations = consultations_collection.find({'doctorId': doctor_id})
        result = []
        for consultation in consultations:
            consultation['_id'] = str(consultation['_id'])
            consultation['createdAt'] = consultation['createdAt'].isoformat()
            consultation['updatedAt'] = consultation['updatedAt'].isoformat()
            result.append(consultation)
        return result
    except Exception as e:
        print(f"Error finding consultations by doctor: {e}")
        return []

def find_consultations_by_appointment(appointment_id):
    try:
        consultations = consultations_collection.find({'appointmentId': appointment_id})
        result = []
        for consultation in consultations:
            consultation['_id'] = str(consultation['_id'])
            consultation['createdAt'] = consultation['createdAt'].isoformat()
            consultation['updatedAt'] = consultation['updatedAt'].isoformat()
            result.append(consultation)
        return result
    except Exception as e:
        print(f"Error finding consultations by appointment: {e}")
        return []

def find_consultations_by_patient(patient_id):
    try:
        consultations = consultations_collection.find({'patientId': patient_id})
        result = []
        for consultation in consultations:
            consultation['_id'] = str(consultation['_id'])
            consultation['createdAt'] = consultation['createdAt'].isoformat()
            consultation['updatedAt'] = consultation['updatedAt'].isoformat()
            result.append(consultation)
        return result
    except Exception as e:
        print(f"Error finding consultations by patient: {e}")
        return []

def update_consultation(consultation_id, updates):
    try:
        update_data = {
            'diagnosis': updates.get('diagnosis'),
            'prescription': updates.get('prescription'),
            'documents': updates.get('documents'),
            'notes': updates.get('notes'),
            'updatedAt': datetime.now(UTC)
        }
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        result = consultations_collection.update_one(
            {'_id': ObjectId(consultation_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating consultation: {e}")
        return False

def delete_consultation(consultation_id):
    try:
        # Optionally delete associated files
        consultation = find_consultation_by_id(consultation_id)
        if consultation and 'documents' in consultation:
            for doc in consultation['documents']:
                file_path = doc.get('path')
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
        result = consultations_collection.delete_one({'_id': ObjectId(consultation_id)})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting consultation: {e}")
        return False