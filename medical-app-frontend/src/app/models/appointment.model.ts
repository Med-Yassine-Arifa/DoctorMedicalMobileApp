export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  reason: string;
  createdAt: string;
  updatedAt: string;
  notificationSent: boolean;
}
