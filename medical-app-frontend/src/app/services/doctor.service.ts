import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    role: string;
    doctorId: string;
}

interface DeleteDoctorResponse {
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class DoctorService {
    constructor(private http: HttpClient) {}

    createDoctor(doctorData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        specialization: string;
        licenseNumber: string;
        availability: AvailabilitySlot[];
    }): Observable<CreateDoctorResponse> {
        console.log('Creating doctor with data:', doctorData);
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        return this.http.post<CreateDoctorResponse>(
            `${environment.apiUrl}/admin/create-doctor`,
            doctorData,
            { headers }
        );
    }

    getDoctor(doctorId: string): Observable<DoctorUser> {
        return this.http.get<DoctorResponse>(
            `${environment.apiUrl}/admin/doctor/${doctorId}`
        ).pipe(
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
        console.log('Updating doctor with ID:', doctorId, 'Data:', doctorData);
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        return this.http.put<UpdateDoctorResponse>(
            `${environment.apiUrl}/admin/update-doctor/${doctorId}`,
            doctorData,
            { headers }
        );
    }

    deleteDoctor(doctorId: string): Observable<DeleteDoctorResponse> {
        console.log('Deleting doctor with ID:', doctorId);
        return this.http.delete<DeleteDoctorResponse>(
            `${environment.apiUrl}/admin/delete-doctor/${doctorId}`
        );
    }
}
