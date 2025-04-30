import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {Observable, throwError} from "rxjs";
import {catchError, switchMap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = environment.apiUrl; // Base URL from environment

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  bookAppointment(appointment: { doctor_id: string; patient_id: string; date: string; time: string }): Observable<any> {
    return this.authService.getAuthToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No authentication token available');
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(`${this.apiUrl}/appointments`, appointment, { headers }).pipe(
          catchError(err => {
            return throwError(() => new Error(err.message || 'Failed to book appointment'));
          })
        );
      })
    );
  }

  checkAvailability(doctorId: string, date: string): Observable<{ available_times: string[] }> {
    return this.authService.getAuthToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No authentication token available');
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<{ available_times: string[] }>(
          `${this.apiUrl}/appointments/availability?doctor_id=${doctorId}&date=${date}`,
          { headers }
        ).pipe(
          catchError(err => {
            return throwError(() => new Error(err.message || 'Failed to fetch availability'));
          })
        );
      })
    );
  }
}
