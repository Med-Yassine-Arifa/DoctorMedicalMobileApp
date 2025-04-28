import firebase_admin
from firebase_admin import auth, credentials
from models.User import find_user_by_email
from services.auth_service import create_user_account
from datetime import datetime, UTC

cred = credentials.Certificate('key/firebase-service-account.json')
firebase_admin.initialize_app(cred)

def create_admin_user(email, password, first_name, last_name, phone='', address=''):
    role = 'admin'
    try:
        # Check if user exists in MongoDB
        if find_user_by_email(email):
            print(f"Admin with email {email} already exists in MongoDB")
            return None

        # Check if user exists in Firebase
        try:
            auth.get_user_by_email(email)
            print(f"Admin with email {email} already exists in Firebase")
            return None
        except auth.UserNotFoundError:
            pass

        # Create Firebase user
        firebase_user = auth.create_user(email=email, password=password)
        auth.set_custom_user_claims(firebase_user.uid, {'role': role})

        # Create MongoDB user
        profile = {
            'firstName': first_name,
            'lastName': last_name,
            'phone': phone,
            'address': address
        }
        create_user_account(
            email=email,
            password=None,
            role=role,
            profile_data=profile,
            google_id=None,
            firebase_uid=firebase_user.uid
        )

        print(f"Admin created successfully: {email}")
        return {'message': 'Admin created', 'userId': firebase_user.uid}

    except auth.EmailAlreadyExistsError:
        print(f"Email already exists in Firebase: {email}")
        return {'error': 'Email already exists in Firebase'}
    except Exception as e:
        print(f"Error creating admin: {str(e)}")
        return {'error': str(e)}

# Example usage
if __name__ == "__main__":
    result = create_admin_user(
        email="admin@admin.com",
        password="admin123",
        first_name="Admin",
        last_name="User",
        phone="+1234567890",
        address="123 Admin Street"
    )
    print(result)