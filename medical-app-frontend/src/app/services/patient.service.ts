import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import {catchError, delay, map, retryWhen, switchMap, take} from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { getAuth } from 'firebase/auth';
import {AvailabilitySlot, DoctorUser} from '../models/user.model';

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
@Injectable({
  providedIn: 'root'
})

export class PatientService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): Observable<HttpHeaders> {
    const auth = getAuth();
    if (!auth) {
      console.error('Firebase auth not initialized');
      return throwError(() => new Error('Firebase auth not initialized'));
    }
    const user = auth.currentUser;
    if (!user) {
      console.warn('No user logged in. Cannot retrieve Firebase token.');
      return throwError(() => new Error('No authenticated user found'));
    }
    console.log('Fetching token for user:', user.uid);
    return from(user.getIdToken(true)).pipe(
      map(token => {
        if (token) {
          console.log('Firebase Token:', token);
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            console.log('Token Timestamps:', {
              iat: new Date(decoded.iat * 1000 - 60000).toISOString(),
              exp: new Date(decoded.exp * 1000).toISOString(),
              clientTime: new Date().toISOString()
            });
          } catch (e) {
            console.error('Error decoding token:', e);
          }
          return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          });
        }
        console.error('Failed to retrieve Firebase token');
        return new HttpHeaders({ 'Content-Type': 'application/json' });
      }),
      catchError(error => {
        console.error('Error retrieving Firebase token:', error);
        return throwError(() => new Error('Failed to retrieve authentication token: ' + error.message));
      })
    );
  }

  getPopularDoctors(specialization?: string): Observable<DoctorUser[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        const url = specialization
          ? `${this.apiUrl}/doctors/popular?specialization=${encodeURIComponent(specialization)}`
          : `${this.apiUrl}/doctors/popular`;
        return this.http.get<DoctorUser[]>(url, { headers }).pipe(
          catchError(error => {
            console.error('Error fetching popular doctors:', error);
            return throwError(() => new Error('Failed to fetch popular doctors'));
          })
        );
      })
    );
  }

  getAllDoctors(specialization?: string):Observable<DoctorUser[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        const url = specialization
          ? `${this.apiUrl}/doctors?specialization=${encodeURIComponent(specialization)}`
          : `${this.apiUrl}/doctors`;
        return this.http.get<DoctorUser[]>(url, { headers }).pipe(
          catchError(error => {
            console.error('HTTP error response:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              errorBody: error.error
            });
            return throwError(() => new Error('Failed to fetch popular doctors'));
          })
        );
      })
    );
  }

  getDoctor(doctorId: string): Observable<DoctorUser> {
    return this.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<DoctorResponse>(`${environment.apiUrl}/doctors/${doctorId}`, { headers }).pipe(
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
      retryWhen(errors =>
        errors.pipe(
          delay(1000),
          take(2),
          catchError(error => {
            console.error('Error in getDoctor after retries:', error);
            return throwError(() => error);
          })
        )
      ),
      catchError(error => {
        console.error('Error in getDoctor:', error);
        return throwError(() => error);
      })
    );
  }

  searchDoctors(query: string): Observable<DoctorUser[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        const url = `${this.apiUrl}/doctors/search?query=${encodeURIComponent(query)}`;
        return this.http.get<DoctorUser[]>(url, { headers }).pipe(
          catchError(error => {
            console.error('Error searching doctors:', error);
            return throwError(() => new Error('Failed to search doctors'));
          })
        );
      })
    );
  }
}
