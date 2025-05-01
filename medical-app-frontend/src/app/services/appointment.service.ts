import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  bookAppointment(appointment: { doctorId: string; date: string; time: string; reason: string }): Observable<{ message: string; appointmentId: string }> {
    return this.authService.getAuthToken().pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('No authentication token available'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<{ message: string; appointmentId: string }>(
          `${this.apiUrl}/appointments`,
          appointment,
          { headers }
        ).pipe(
          catchError(err => {
            return throwError(() => new Error(err.error?.error || 'Failed to book appointment'));
          })
        );
      })
    );
  }

  getPatientAppointments(): Observable<Appointment[]> {
    return this.authService.getAuthToken().pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('No authentication token available'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<Appointment[]>(
          `${this.apiUrl}/appointments/patient`,
          { headers }
        ).pipe(
          catchError(err => {
            return throwError(() => new Error(err.error?.error || 'Failed to fetch appointments'));
          })
        );
      })
    );
  }

  getDoctorAppointments(status: string = 'pending'): Observable<Appointment[]> {
    return this.authService.getAuthToken().pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('No authentication token available'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<Appointment[]>(
          `${this.apiUrl}/appointments/doctor?status=${status}`,
          { headers }
        ).pipe(
          catchError(err => {
            return throwError(() => new Error(err.error?.error || 'Failed to fetch appointments'));
          })
        );
      })
    );
  }

  getAppointmentById(appointmentId: string): Observable<Appointment> {
    return this.authService.getAuthToken().pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('No authentication token available'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<Appointment>(
          `${this.apiUrl}/appointments/${appointmentId}`,
          { headers }
        ).pipe(
          catchError(err => {
            return throwError(() => new Error(err.error?.error || 'Failed to fetch appointment'));
          })
        );
      })
    );
  }

  updateAppointmentStatus(appointmentId: string, status: 'confirmed' | 'rejected'): Observable<{ message: string }> {
    return this.authService.getAuthToken().pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('No authentication token available'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.put<{ message: string }>(
          `${this.apiUrl}/appointments/${appointmentId}/status`,
          { status },
          { headers }
        ).pipe(
          catchError(err => {
            return throwError(() => new Error(err.error?.error || 'Failed to update appointment status'));
          })
        );
      })
    );
  }
}
