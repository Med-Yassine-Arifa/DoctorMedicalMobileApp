export interface Consultation {
  _id: string;          // the raw MongoDB ID
  id: string;
  doctorName: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  prescription: string;
  documents?: any[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
