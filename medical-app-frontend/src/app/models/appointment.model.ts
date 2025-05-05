export interface Appointment {
  patientName: string | undefined;
  doctorName: string | undefined;
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled'
  reason: string;
  createdAt: string;
  updatedAt: string;
  notificationSent: boolean;  
}
