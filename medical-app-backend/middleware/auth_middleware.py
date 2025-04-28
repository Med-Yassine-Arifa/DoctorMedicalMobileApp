from functools import wraps
from flask import request, jsonify
from firebase_admin import auth


def firebase_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        print(f"Authorization Header: {auth_header}")  # Debug
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header missing or invalid'}), 401

        token = auth_header.split('Bearer ')[1]
        try:
            decoded_token = auth.verify_id_token(token)
            print(f"Decoded Token: {decoded_token}")  # Debug
            request.user = decoded_token
            return f(*args, **kwargs)
        except auth.ExpiredIdTokenError:
            print("Expired Firebase token")
            return jsonify({'error': 'Expired Firebase token'}), 401
        except auth.InvalidIdTokenError:
            print("Invalid Firebase token")
            return jsonify({'error': 'Invalid Firebase token'}), 401
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            return jsonify({'error': f'Authentication error: {str(e)}'}), 401

    return decorated_function


def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            print(f"User Claims: {request.user.get('role')}")  # Debug
            if not request.user.get('role') == role:
                return jsonify({'error': f'Access denied: {role} role required'}), 403
            return f(*args, **kwargs)

        return decorated_function

    return decorator