export interface Consultation {
  doctorName: string;
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  prescription: string;
  documents: Array<{
    original_name: string;
    documentId: string;
    fileName: string;
  }>;
  notes?: string;
  createdAt: string;
}
