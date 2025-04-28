from functools import wraps
from flask import jsonify, request

def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not hasattr(request, 'user'):
                return jsonify({'error': 'User not authenticated'}), 401
            token_role = request.user.get('role')
            if not token_role:
                return jsonify({'error': 'Role not found in token'}), 403
            if token_role != role:
                return jsonify({'error': 'Unauthorized: Incorrect role'}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator