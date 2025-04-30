from urllib import request
from venv import logger

from flask import Flask
from flask_mail import Mail
from flask_cors import CORS

from api import auth, admin
from api.admin import admin_bp
from api.patient import patient_bp
from config import Config
from api.auth import auth_bp
import firebase_admin
from firebase_admin import credentials


app = Flask(__name__)

# Load configurations
app.config.from_object(Config)

# Initialize extensions
mail = Mail(app)
CORS(app, resources={r"/api/*": {
    "origins": "http://localhost:8100",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(patient_bp, url_prefix='/api')

cred = credentials.Certificate('key/firebase-service-account.json')
firebase_admin.initialize_app(cred)

if __name__ == '__main__':
    app.run(debug=True)