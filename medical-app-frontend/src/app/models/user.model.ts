export interface Profile {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface User {
  firebaseUid: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientUser extends User {
  role: 'patient';
  profile: Profile;
}

export interface DoctorUser extends User {
  role: 'doctor';
  profile: Profile & {
    specialization: string;
    licenseNumber: string;
  };
  availability: AvailabilitySlot[];
}

export interface AdminUser extends User {
  role: 'admin';
}
