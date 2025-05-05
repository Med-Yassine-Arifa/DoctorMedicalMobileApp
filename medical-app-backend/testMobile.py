from flask import Flask, jsonify
from flask_cors import CORS  # Import CORS

app = Flask(__name__)

# Configure CORS to allow requests from your mobile app/emulator
# Replace "http://localhost:8100" with your actual client origin (or "*" for testing)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:8100", "http://192.168.43.23:8100", "*"]
    }
})

# Test route to check if the server is running
@app.route('/')
def home():
    print("DEBUG: Root route was called!")  # Check server logs
    return "Flask server is running!"

# Simple API endpoint to test connectivity
@app.route('/test', methods=['GET'])
def test():
    print("DEBUG: /test route was called!")  # Check server logs
    return jsonify({"message": "Hello from Flask!", "status": "success"})

if __name__ == '__main__':
    print("DEBUG: Starting Flask server...")  # Confirm script runs
    app.run(host='0.0.0.0', port=5000, debug=True)