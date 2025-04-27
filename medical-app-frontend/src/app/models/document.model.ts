export interface Document {
  id: string;
  patientId: string;
  doctorId?: string;
  fileName: string;
  fileType: string;
  status: 'not consulted' | 'consulted';
  comments?: string;
  appointmentId?: string;
  uploadedAt: string;
  consultedAt?: string;
}
