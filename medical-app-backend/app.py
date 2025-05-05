from urllib import request
from venv import logger

from flask import Flask
from flask_mail import Mail

from api import auth, admin
from api.admin import admin_bp
from api.appointments import appointments_bp
from api.patient import patient_bp
from config import Config
from api.auth import auth_bp
import firebase_admin
from firebase_admin import credentials
from flask_cors import CORS
from api.consultation import consultation_bp


app = Flask(__name__)

# Load configurations
app.config.from_object(Config)

cred = credentials.Certificate('key/firebase-service-account.json')
firebase_admin.initialize_app(cred)
# Initialize extensions
mail = Mail(app)


CORS(app, resources={r"/api/*": {
        "origins": ["http://localhost:8100", "http://192.168.43.23:8100", "*"],
    }})


@app.route('/')
def home():
    print(request.headers)
# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(patient_bp, url_prefix='/api')
app.register_blueprint(appointments_bp, url_prefix='/api')
app.register_blueprint(consultation_bp, url_prefix='/api/consultation')






if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)