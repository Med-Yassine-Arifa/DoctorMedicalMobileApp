from bson import ObjectId
from pymongo import MongoClient
from datetime import datetime, UTC

client = MongoClient('mongodb+srv://arifamohamedyassine1234:YHSnqgUTa1E20ngU@medicalapp.ndeyixq.mongodb.net/')
db = client['medical_app']
users_collection = db['User']

def find_user_by_email(email):
    user = users_collection.find_one({'email': email})
    if user:
        user_data = {
            'firebaseUid': user.get('firebaseUid', ''),
            'email': user['email'],
            'password': user.get('password'),
            'googleId': user.get('googleId'),
            'role': user['role'],
            'profile': user.get('profile', {
                'firstName': '',
                'lastName': '',
                'phone': '',
                'address': ''
            }),
            'fcmToken': user.get('fcmToken', ''),
            'createdAt': user['createdAt'].isoformat(),
            'updatedAt': user['updatedAt'].isoformat(),
            'otp': user.get('otp'),
            'otp_expiry': user.get('otp_expiry').isoformat() if user.get('otp_expiry') else None
        }
        if user['role'] == 'doctor':
            user_data['profile'] = {
                'firstName': user['profile'].get('firstName', ''),
                'lastName': user['profile'].get('lastName', ''),
                'phone': user['profile'].get('phone', ''),
                'address': user['profile'].get('address', ''),
                'specialization': user['profile'].get('specialization', ''),
                'licenseNumber': user['profile'].get('licenseNumber', '')
            }
            user_data['availability'] = user.get('availability', [])
        return user_data
    return None

def find_user_by_id(firebase_uid):
    try:
        user = users_collection.find_one({'firebaseUid': firebase_uid})
        if user:
            return find_user_by_email(user['email'])  # Reuse existing function
        return None
    except Exception as e:
        print(f"Error finding user by ID: {e}")
        return None


def get_all_doctors():
    doctors = []
    try:
        doctor_cursor = users_collection.find({'role': 'doctor'})
        for doctor in doctor_cursor:
            doctor_data = find_user_by_email(doctor['email'])
            if doctor_data:
                doctors.append(doctor_data)
        return doctors
    except Exception as e:
        print(f"Error getting all doctors: {e}")
        return []

def create_user(user):
    user_data = {
        'firebaseUid': user.get('firebaseUid', ''),
        'email': user['email'],
        'password': user.get('password'),
        'googleId': user.get('googleId'),
        'role': user['role'],
        'profile': user['profile'],
        'fcmToken': user.get('fcmToken', ''),
        'createdAt': user['createdAt'],
        'updatedAt': user['updatedAt']
    }
    if user['role'] == 'doctor':
        user_data['availability'] = user.get('availability', [])

    result = users_collection.insert_one(user_data)
    user_data['firebaseUid'] = user.get('firebaseUid', '')  # Ensure firebaseUid is returned
    return user_data

def update_user_email(email, updates):
    updates['updatedAt'] = datetime.now(UTC)
    result = users_collection.update_one({'email': email}, {'$set': updates})
    print(f"Update result for {email}: modified_count={result.modified_count}, matched_count={result.matched_count}")
    return result.modified_count > 0


def update_user(firebase_uid, updates):
    try:
        update_data = {}

        # Handle email update
        if 'email' in updates:
            update_data['email'] = updates['email']

        # Handle profile updates
        if 'profile' in updates:
            for key, value in updates['profile'].items():
                update_data[f'profile.{key}'] = value

        # Handle availability updates
        if 'availability' in updates:
            update_data['availability'] = updates['availability']

        # Set updated timestamp
        update_data['updatedAt'] = datetime.now(UTC)

        # Update the document
        result = users_collection.update_one(
            {'firebaseUid': firebase_uid},
            {'$set': update_data}
        )
        print(
            f"Update result for firebaseUid {firebase_uid}: modified_count={result.modified_count}, matched_count={result.matched_count}")

        return result.modified_count > 0

    except Exception as e:
        print(f"Error updating user: {e}")
        return False


def delete_user(firebase_uid):
    try:

        result = users_collection.delete_one({'firebaseUid': firebase_uid})

        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting user: {e}")
        return False
