import { Component, OnInit } from '@angular/core';

import {
  IonBackButton, IonButton,
  IonButtons, IonCard, IonCardContent,
  IonContent,
  IonHeader, IonItem, IonLabel, IonList,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import {ActivatedRoute, Router} from "@angular/router";
import {AppointmentService} from "../../services/appointment.service";
import {SqliteStorageService} from "../../services/sqlite-storage.service";
import {ToastController} from "@ionic/angular";
import {Appointment} from "../../models/appointment.model";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {Consultation} from "../../models/consultation.model";
import {ConsultationService} from "../../services/consultation.service";


interface Document {
  id?: number;
  appointmentId: string;
  doctorId: string;
  filename: string;
  fileData: string;
  mimeType: string;
  createdAt: string;
  status: 'pending' | 'viewed';
}

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.page.html',
  styleUrls: ['./appointment-details.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle,
    IonToolbar, CommonModule, FormsModule,
    IonButtons, IonBackButton, IonSpinner,
    IonCard, IonCardContent, IonButton,
    IonList, IonItem, IonLabel]
})



export class AppointmentDetailsPage implements OnInit {

  appointment: Appointment | null = null;
  consultations: Consultation | null = null;
  documents: Document[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  isUploading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private consultationService: ConsultationService,
    private appointmentService: AppointmentService,
    private sqliteStorageService: SqliteStorageService,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const appointmentId = params['appointmentId'];
      console.log('Received appointmentId:', appointmentId); // Debug log
      if (appointmentId) {
        this.loadAppointmentDetails(appointmentId);
        this.loadConsultations(appointmentId);
      } else {
        this.errorMessage = 'No appointment ID provided.';
      }
    });
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  loadAppointmentDetails(appointmentId: string) {
    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentService.getAppointmentById(appointmentId).subscribe({
      next: (appointment) => {
        this.appointment = appointment
        if (!this.appointment) {
          this.errorMessage = 'Appointment not found.';
          this.isLoading = false;
          return;
        }
        this.loadDocuments(appointmentId);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message;
        this.presentToast('Failed to load appointment details.');
      }
    });
  }

  loadConsultations(appointmentId: string) {
    this.consultationService.getConsultationByAppointmentPatientVersion(appointmentId).subscribe({
      next: (consultations) => {
        this.consultations = consultations;
      },
      error: (err) => {
        this.presentToast('Failed to load consultations.');
      }
    });
  }

  loadDocuments(appointmentId: string) {
    this.sqliteStorageService.getDocumentsByAppointment(appointmentId).subscribe({
      next: (docs) => {
        this.documents = docs;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.presentToast('Failed to load documents.');
      }
    });
  }

  uploadDocument(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploading = true;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const doc: Document = {
        appointmentId: this.appointment!.id,
        doctorId: this.appointment!.doctorId,
        filename: file.name,
        fileData: base64Data,
        mimeType: file.type,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      this.sqliteStorageService.saveDocument(doc).subscribe({
        next: () => {
          this.documents.push(doc);
          this.isUploading = false;
          this.presentToast('Document uploaded successfully.', 'success');
        },
        error: (err) => {
          this.isUploading = false;
          this.presentToast('Failed to upload document.');
        }
      });
    };
    reader.onerror = () => {
      this.isUploading = false;
      this.presentToast('Error reading file.');
    };
    reader.readAsDataURL(file);
  }

  downloadDocument(doc: Document) {
    const byteCharacters = atob(doc.fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: doc.mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }


}
