import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Consultation } from '../models/consultation.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private apiUrl = `${environment.apiUrl}/consultation`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): Observable<HttpHeaders> {
    return this.authService.getAuthToken().pipe(
      map(token => {
        if (!token) throw new Error('No authentication token available');
        return new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
      })
    );
  }

  getConsultationByAppointment(appointmentId: string): Observable<Consultation | null> {
    return this.getHeaders().pipe(
      switchMap(headers =>
        this.http.get<any>(`${this.apiUrl}/consultations/appointment/${appointmentId}`, { headers }).pipe(
          map(consultation => ({
            ...consultation,
            id: consultation._id
          })),
          catchError(error => {
            if (error.status === 404) {
              return throwError(() => null);
            } else if (error.status === 403) {
              console.log('Unauthorized: Not your consultation');
              return throwError(() => new Error('Unauthorized: You do not have permission to view this consultation'));
            }
            console.error('Error fetching consultation by appointment:', error);
            return throwError(() =>
              new Error(error.error?.error || 'Failed to fetch consultation')
            );
          })
        )
      )
    );
  }

  getConsultationByAppointmentPatientVersion(appointmentId: string): Observable<Consultation | null> {
    return this.getHeaders().pipe(
      switchMap(headers =>
        this.http.get<any>(`${this.apiUrl}/patient/consultation/appointment/${appointmentId}`, { headers }).pipe(
          map(consultation => ({
            ...consultation,
            id: consultation._id
          })),
          catchError(error => {
            if (error.status === 404) {
              return throwError(() => null);
            } else if (error.status === 403) {
              console.log('Unauthorized: Not your consultation');
              return throwError(() => new Error('Unauthorized: You do not have permission to view this consultation'));
            }
            console.error('Error fetching consultation by appointment:', error);
            return throwError(() =>
              new Error(error.error?.error || 'Failed to fetch consultation')
            );
          })
        )
      )
    );
  }

  getPatientConsultations(): Observable<Consultation[]> {
    return this.getHeaders().pipe(
      switchMap(headers =>
        this.http.get<Consultation[]>(`${this.apiUrl}/patient/consultations`, { headers })
      ),
      map(list =>
        list.map(c => ({
          ...c,
          id: c.id
        }))
      ),
      catchError(error => {
        console.error('Error fetching patient consultations:', error);
        return throwError(() =>
          new Error(error.error?.error || 'Failed to fetch patient consultations')
        );
      })
    );
  }

  deleteConsultation(consultationId: string): Observable<void> {
    if (!consultationId) {
      console.error('Missing consultation ID!');
      return throwError(() => new Error('Missing consultation ID!'));
    }
    return this.getHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.apiUrl}/consultations/${consultationId}`, { headers })
      ),
      catchError(error => {
        console.error('Error deleting consultation:', error);
        return throwError(() =>
          new Error(error.error?.error || 'Failed to delete consultation')
        );
      })
    );
  }

  createConsultation(
    consultation: Partial<Consultation>,
    files: File[] = []
  ): Observable<Consultation> {
    return this.getHeaders().pipe(
      switchMap(headers => {
        const formData = new FormData();
        Object.entries(consultation).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const fieldValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            formData.append(key, fieldValue);
          }
        });
        files.forEach(file => {
          formData.append('files', file, file.name);
        });
        return this.http.post<Consultation>(`${this.apiUrl}/consultations`, formData, { headers });
      }),
      catchError(error => {
        console.error('Error creating consultation:', error);
        return throwError(() =>
          new Error(error.error?.error || 'Failed to create consultation')
        );
      })
    );
  }


  updateConsultation(id: string, updates: Partial<Consultation>): Observable<void> {
    return this.getHeaders().pipe(
      switchMap((headers: HttpHeaders) =>
        this.http.put<void>(`${this.apiUrl}/consultations/${id}`, updates, { headers })
      ),
      catchError(error => {
        console.error('Error updating consultation:', error);
        return throwError(() => new Error(error.error?.error || 'Failed to update consultation'));
      })
    );
  }

  downloadDocument(consultationId: string, filename: string): Observable<Blob> {
    return this.getHeaders().pipe(
      switchMap((headers: HttpHeaders) =>
        this.http.get(`${this.apiUrl}/consultations/${consultationId}/documents/${filename}`, {
          headers,
          responseType: 'blob'
        })
      ),
      catchError(error => {
        console.error('Error downloading document:', error);
        return throwError(() => new Error(error.error?.error || 'Failed to download document'));
      })
    );
  }
}
