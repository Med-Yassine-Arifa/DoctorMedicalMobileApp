export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  prescription: string;
  documents: Array<{
    documentId: string;
    fileName: string;
  }>;
  notes?: string;
  createdAt: string;
}
