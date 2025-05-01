from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, UTC

client = MongoClient('mongodb+srv://arifamohamedyassine1234:YHSnqgUTa1E20ngU@medicalapp.ndeyixq.mongodb.net/')
db = client['medical_app']
appointments_collection = db['appointments']

def create_appointment(patient_id: str, doctor_id: str, date: str, duration: int, reason: str):
    appointment = {
        'patientId': patient_id,
        'doctorId': doctor_id,
        'date': date,
        'duration': duration,
        'status': 'pending',
        'reason': reason,
        'createdAt': datetime.now(UTC).isoformat(),
        'updatedAt': datetime.now(UTC).isoformat(),
        'notificationSent': False
    }
    result = appointments_collection.insert_one(appointment)
    appointment['id'] = str(result.inserted_id)
    return appointment

def get_appointments_by_doctor(doctor_id: str, status: str = None):
    query = {'doctorId': doctor_id}
    if status:
        query['status'] = status
    appointments = appointments_collection.find(query)
    return [
        {
            'id': str(appt['_id']),
            'patientId': appt['patientId'],
            'doctorId': appt['doctorId'],
            'date': appt['date'],
            'duration': appt['duration'],
            'status': appt['status'],
            'reason': appt['reason'],
            'createdAt': appt['createdAt'],
            'updatedAt': appt['updatedAt']
        }
        for appt in appointments
    ]

def get_appointments_by_patient(patient_id: str):
    appointments = appointments_collection.find({'patientId': patient_id})
    return [
        {
            'id': str(appt['_id']),
            'patientId': appt['patientId'],
            'doctorId': appt['doctorId'],
            'date': appt['date'],
            'duration': appt['duration'],
            'status': appt['status'],
            'reason': appt['reason'],
            'createdAt': appt['createdAt'],
            'updatedAt': appt['updatedAt']
        }
        for appt in appointments
    ]

def update_appointment_status(appointment_id: str, status: str):
    update_data = {
        'status': status,
        'updatedAt': datetime.now(UTC).isoformat()
    }
    result = appointments_collection.update_one(
        {'_id': ObjectId(appointment_id)},
        {'$set': update_data}
    )
    return result.modified_count > 0

def get_appointment_by_id(appointment_id: str):
    appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
    if appointment:
        return {
            'id': str(appointment['_id']),
            'patientId': appointment['patientId'],
            'doctorId': appointment['doctorId'],
            'date': appointment['date'],
            'duration': appointment['duration'],
            'status': appointment['status'],
            'reason': appointment['reason'],
            'createdAt': appointment['createdAt'],
            'updatedAt': appointment['updatedAt']
        }
    return None