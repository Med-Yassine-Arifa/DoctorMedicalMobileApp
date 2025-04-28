from functools import wraps
from flask import jsonify, request

def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.user.get('role') == role:
                return jsonify({'error': f'Access denied: {role} role required'}), 403
            return f(*args, **kwargs)

        return decorated_function

    return decorator