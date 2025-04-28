import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AvailabilitySlot, DoctorUser } from '../models/user.model';
import { getAuth } from 'firebase/auth';

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

  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(getAuth().currentUser?.getIdToken() || Promise.resolve('')).pipe(
      map(token => {
        if (token) {
          console.log('Firebase Token:', token);
          return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          });
        }
        console.warn('No user logged in or token unavailable');
        return new HttpHeaders({ 'Content-Type': 'application/json' });
      }),
      catchError(error => {
        console.error('Error retrieving Firebase token:', error);
        return throwError(() => new Error('Failed to retrieve authentication token'));
      })
    );
  }

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
    return this.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.post<CreateDoctorResponse>(
          `${environment.apiUrl}/admin/create-doctor`,
          doctorData,
          { headers }
        )
      ),
      catchError(error => {
        console.error('Error in createDoctor:', error);
        return throwError(() => error);
      })
    );
  }

  getAllDoctors(): Observable<DoctorUser[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<DoctorResponse[]>(`${environment.apiUrl}/admin/doctors`, { headers }).pipe(
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
        )
      ),
      catchError(error => {
        console.error('Error in getAllDoctors:', error);
        return throwError(() => error);
      })
    );
  }

  getDoctor(doctorId: string): Observable<DoctorUser> {
    return this.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<DoctorResponse>(`${environment.apiUrl}/admin/doctors/${doctorId}`, { headers }).pipe(
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
        )
      ),
      catchError(error => {
        console.error('Error in getDoctor:', error);
        return throwError(() => error);
      })
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
    return this.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<UpdateDoctorResponse>(
          `${environment.apiUrl}/admin/doctors/${doctorId}`,
          doctorData,
          { headers }
        )
      ),
      catchError(error => {
        console.error('Error in updateDoctor:', error);
        return throwError(() => error);
      })
    );
  }

  deleteDoctor(doctorId: string): Observable<DeleteDoctorResponse> {
    return this.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.delete<DeleteDoctorResponse>(`${environment.apiUrl}/admin/doctors/${doctorId}`, { headers })
      ),
      catchError(error => {
        console.error('Error in deleteDoctor:', error);
        return throwError(() => error);
      })
    );
  }
}
