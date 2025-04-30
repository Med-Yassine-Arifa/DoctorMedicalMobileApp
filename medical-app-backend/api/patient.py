from flask import Blueprint, jsonify, request
from middleware.auth_middleware import firebase_auth_required
from middleware.role_middleware import role_required
from models.User import get_popular_doctors,get_all_doctors_patient,search_doctors
patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/doctors/popular', methods=['GET'])
@firebase_auth_required
@role_required('patient')
def get_popular_doctors_endpoint():
    try:
        specialization = request.args.get('specialization')
        doctors = get_popular_doctors(specialization)
        return jsonify(doctors), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@patient_bp.route('/doctors', methods=['GET'])
@firebase_auth_required
@role_required('patient')
def get_all_doctors_endpoint():
    try:
        specialization = request.args.get('specialization')
        doctors = get_all_doctors_patient(specialization)
        return jsonify(doctors), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@patient_bp.route('/doctors/search', methods=['GET'])
@firebase_auth_required
@role_required('patient')
def search_doctors_endpoint():
    try:
        query = request.args.get('query')
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        doctors = search_doctors(query)
        return jsonify(doctors), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500