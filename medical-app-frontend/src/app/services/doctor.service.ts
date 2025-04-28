import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AvailabilitySlot, DoctorUser } from '../models/user.model';

interface CreateDoctorResponse {
  message: string;
  role: string;
  doctorId: string;
}

interface DoctorResponse {
  firebaseUid: string;
  email: string;
  role: 'doctor';
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    specialization: string;
    licenseNumber: string;
  };
  availability: AvailabilitySlot[];
  createdAt: string;
  updatedAt: string;
}

interface UpdateDoctorResponse {
  message: string;
}

interface DeleteDoctorResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private doctorListUpdated = new Subject<void>();
  doctorListUpdated$ = this.doctorListUpdated.asObservable();

  constructor(private http: HttpClient) {}

  notifyDoctorListUpdate() {
    this.doctorListUpdated.next();

  }

  createDoctor(doctorData: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    specialization: string;
    licenseNumber: string;
    availability: AvailabilitySlot[];
  }): Observable<CreateDoctorResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<CreateDoctorResponse>(
      `${environment.apiUrl}/admin/create-doctor`,
      doctorData,
      { headers }
    );
  }

  getAllDoctors(): Observable<DoctorUser[]> {
    return this.http.get<DoctorResponse[]>(`${environment.apiUrl}/admin/doctors`).pipe(
      map(doctors =>
        doctors.map(doctor => ({
          firebaseUid: doctor.firebaseUid,
          email: doctor.email,
          role: doctor.role,
          profile: {
            firstName: doctor.profile.firstName,
            lastName: doctor.profile.lastName,
            phone: doctor.profile.phone || '',
            address: doctor.profile.address || '',
            specialization: doctor.profile.specialization || '',
            licenseNumber: doctor.profile.licenseNumber || ''
          },
          availability: doctor.availability || [],
          createdAt: doctor.createdAt,
          updatedAt: doctor.updatedAt
        } as DoctorUser))
      )
    );
  }

  getDoctor(doctorId: string): Observable<DoctorUser> {
    return this.http.get<DoctorResponse>(`${environment.apiUrl}/admin/doctors/${doctorId}`).pipe(
      map(response => ({
        firebaseUid: response.firebaseUid,
        email: response.email,
        role: response.role,
        profile: {
          firstName: response.profile.firstName,
          lastName: response.profile.lastName,
          phone: response.profile.phone || '',
          address: response.profile.address || '',
          specialization: response.profile.specialization || '',
          licenseNumber: response.profile.licenseNumber || ''
        },
        availability: response.availability || [],
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      } as DoctorUser))
    );
  }

  updateDoctor(doctorId: string, doctorData: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    specialization?: string;
    licenseNumber?: string;
    availability?: AvailabilitySlot[];
  }): Observable<UpdateDoctorResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<UpdateDoctorResponse>(
      `${environment.apiUrl}/admin/doctors/${doctorId}`,
      doctorData,
      { headers }
    );
  }

  deleteDoctor(doctorId: string): Observable<DeleteDoctorResponse> {
    return this.http.delete<DeleteDoctorResponse>(`${environment.apiUrl}/admin/doctors/${doctorId}`);
  }
}
