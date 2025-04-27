import firebase_admin
from firebase_admin import auth, credentials
from models.User import create_user, find_user_by_email
from services.auth_service import hash_password

from datetime import datetime, UTC

cred = credentials.Certificate('key/firebase-service-account.json')
firebase_admin.initialize_app(cred)


def create_admin_user(email, password, first_name, last_name, phone='', address=''):
    try:
        # Check if the user already exists in MongoDB
        if find_user_by_email(email):
            print(f"Admin with email {email} already exists in MongoDB, aborting...")
            return None

        # Check if the user already exists in Firebase
        try:
            firebase_user = auth.get_user_by_email(email)
            print(f"Admin with email {email} already exists in Firebase (UID: {firebase_user.uid}), aborting...")
            return None
        except auth.UserNotFoundError:
            # Email does not exist in Firebase, proceed with creation
            pass

        # Create user in Firebase Authentication
        user_record = auth.create_user(
            email=email,
            password=password,
            display_name='admin',  # Set display_name to role, consistent with auth.py
            email_verified=True  # Mark email as verified to skip verification
        )
        print(f"Successfully created Firebase user: {user_record.uid}")

        # Hash the password for MongoDB storage
        hashed_password = hash_password(password)

        # Create user in MongoDB using the create_user function from User.py
        now = datetime.now(UTC)
        admin_data = {
            'firebaseUid': user_record.uid,
            'email': email,
            'password': hashed_password,  # Store the hashed password
            'googleId': None,
            'role': 'admin',
            'profile': {
                'firstName': first_name,
                'lastName': last_name,
                'phone': phone,
                'address': address
            },
            'fcmToken': '',
            'createdAt': now,
            'updatedAt': now
        }

        created_user = create_user(admin_data)
        print(f"Admin user successfully added to MongoDB with firebaseUid: {created_user['firebaseUid']}")

        return created_user

    except auth.EmailAlreadyExistsError:
        print(f"Email already exists in Firebase: {email}")
        return None
    except Exception as e:
        print(f"Error creating admin user: {e}")
        # Clean up: Delete the Firebase user if MongoDB creation fails
        if 'user_record' in locals():
            try:
                auth.delete_user(user_record.uid)
                print(f"Rolled back Firebase user: {user_record.uid}")
            except Exception as delete_error:
                print(f"Error deleting Firebase user: {delete_error}")
        return None


# Example usage
if __name__ == "__main__":
    new_admin = create_admin_user(
        email="admin@admin.com",
        password="admin123",
        first_name="Admin",
        last_name="User",
        phone="+1234567890",
        address="123 Admin Street"
    )
    if new_admin:
        print("Admin creation successful!")
    else:
        print("Admin creation failed.")