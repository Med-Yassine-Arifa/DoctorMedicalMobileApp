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
    private authService: AuthService,
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

  getDoctorConsultations(): Observable<Consultation[]> {
    return this.getHeaders().pipe(
      switchMap(headers =>
        this.http.get<Consultation[]>(
          `${this.apiUrl}/consultations`,
          { headers }
        )
      ),
      map(list =>
        list.map(c => ({
          ...c,
          id: c._id
        }))
      ),
      catchError(error => {
        console.error('Error fetching consultations:', error);
        return throwError(() =>
          new Error(error.error?.error || 'Failed to fetch consultations')
        );
      })
    );
  }

  getPatientConsultations(): Observable<Consultation[]> {
    return this.getHeaders().pipe(
      switchMap(headers =>
        this.http.get<Consultation[]>(
          `${this.apiUrl}/patient/consultations`,
          { headers }
        )
      ),
      map(list =>
        list.map(c => ({
          ...c,
          id: c._id
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

  deleteConsultation(id: string): Observable<void> {
    return this.getHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(
          `${this.apiUrl}/consultations/${id}`,
          { headers }
        )
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

        // TS knows key is string, value is any
        Object.entries(consultation).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // If it's an object/array, JSON-stringify; otherwise, cast to string
            const fieldValue =
              typeof value === 'object' ? JSON.stringify(value) : String(value);
            formData.append(key, fieldValue);
          }
        });

        // Append any file attachments
        files.forEach(file => {
          formData.append('files', file, file.name);
        });

        // Send without manually setting Content-Type
        return this.http.post<Consultation>(
          `${this.apiUrl}/consultations`,
          formData,
          { headers }
        );
      }),
      catchError(error => {
        console.error('Error creating consultation:', error);
        return throwError(() =>
          new Error(error.error?.error || 'Failed to create consultation')
        );
      })
    );
  }


  getConsultation(id: string): Observable<Consultation> {
    return this.getHeaders().pipe(
      switchMap((headers: HttpHeaders) =>
        this.http.get<Consultation>(`${this.apiUrl}/consultations/${id}`, { headers })
      ),
      catchError(error => {
        console.error('Error fetching consultation:', error);
        return throwError(() => new Error(error.error?.error || 'Failed to fetch consultation'));
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
}
