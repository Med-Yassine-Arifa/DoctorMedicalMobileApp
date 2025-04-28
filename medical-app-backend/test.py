import firebase_admin
from firebase_admin import auth, credentials
from models.User import find_user_by_email
from services.auth_service import create_user_account
from datetime import datetime, UTC

cred = credentials.Certificate('key/firebase-service-account.json')
firebase_admin.initialize_app(cred)


# Example usage
if __name__ == "__main__":
    user = auth.get_user_by_email('admin@admin.com')
    print(user.custom_claims)