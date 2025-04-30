import firebase_admin
from firebase_admin import auth, credentials
from models.User import find_user_by_email, users_collection
from services.auth_service import create_user_account
from datetime import datetime, UTC

cred = credentials.Certificate('key/firebase-service-account.json')
firebase_admin.initialize_app(cred)


# Example usage
if __name__ == "__main__":
    doctors= []
    doctor_cursor=users_collection.find({'role':'doctor'})
    for doctor in doctor_cursor:
        doctor_data = find_user_by_email(doctor['email'])
        if doctor_data:
            doctors.append(doctor_data)
    print(doctors)