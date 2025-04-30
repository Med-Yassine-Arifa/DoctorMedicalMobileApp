from pydantic import BaseModel
from typing import Literal
from datetime import date
from pymongo import MongoClient

client = MongoClient('mongodb+srv://arifamohamedyassine1234:YHSnqgUTa1E20ngU@medicalapp.ndeyixq.mongodb.net/')
db = client['medical_app']
appointments_collection=db['appointments']

class Appointment(BaseModel):
    id: str | None = None
    doctor_id: str
    patient_id: str
    date: str  # Format: "YYYY-MM-DD"
    time: str  # Format: "HH:MM AM/PM", e.g., "08:00 AM"
    status: Literal["pending", "confirmed", "cancelled"] = "pending"