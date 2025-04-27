from functools import wraps
from flask import jsonify, request
from firebase_admin import auth
import firebase_admin

def firebase_auth_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Authorization token is missing'}), 401

        try:
            # Verify the token (assuming it's a custom token or ID token)
            decoded_token = auth.verify_id_token(token)
            request.user = decoded_token
            return f(*args, **kwargs)
        except auth.ExpiredIdTokenError:
            return jsonify({'error': 'Authorization token has expired'}), 401
        except auth.InvalidIdTokenError:
            return jsonify({'error': 'Invalid authorization token'}), 401
        except Exception as e:
            return jsonify({'error': f'Authentication error: {str(e)}'}), 401

    return decorator