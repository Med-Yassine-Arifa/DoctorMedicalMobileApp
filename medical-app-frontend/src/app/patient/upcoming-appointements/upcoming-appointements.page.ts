import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonAccordionGroup,
  IonBackButton, IonButton,
  IonButtons,
  IonContent,
  IonHeader, IonItem, IonLabel, IonList,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Appointment} from "../../models/appointment.model";
import {AppointmentService} from "../../services/appointment.service";
import {SqliteStorageService} from "../../services/sqlite-storage.service";
import {ToastController} from "@ionic/angular";
import {RouterLink} from "@angular/router";

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
  selector: 'app-upcoming-appointements',
  templateUrl: './upcoming-appointements.page.html',
  styleUrls: ['./upcoming-appointements.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonBackButton, IonSpinner, IonAccordionGroup, IonAccordion, IonItem, IonLabel, IonList, IonButton, RouterLink]
})
export class UpcomingAppointementsPage implements OnInit {
  documents: { [appointmentId: string]: Document[] } = {};
  isUploading: { [appointmentId: string]: boolean } = {};
  confirmedAppointments: Appointment[] = [];
  pendingAppointments: Appointment[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private appointmentService: AppointmentService,
    private toastController: ToastController,
    private sqliteStorageService: SqliteStorageService,
  ) {}

  ngOnInit() {
    this.loadUpcomingAppointments();
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

  loadUpcomingAppointments() {
    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentService.getPatientAppointments().subscribe({
      next: (appointments) => {
        this.categorizeAppointments(appointments);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message;
        this.presentToast('Failed to load appointments.');
      }
    });
  }

  categorizeAppointments(appointments: Appointment[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    this.confirmedAppointments = [];
    this.pendingAppointments = [];

    appointments.forEach((appt) => {
      const apptDate = new Date(appt.date);
      if (apptDate > today) {
        if (appt.status === 'confirmed') {
          this.confirmedAppointments.push(appt);
        } else if (appt.status === 'pending') {
          this.pendingAppointments.push(appt);
        }
      }
    });
  }
  loadDocuments() {
    this.confirmedAppointments.forEach((appt) => {
      this.sqliteStorageService.getDocumentsByAppointment(appt.id).subscribe({
        next: (docs) => {
          this.documents[appt.id] = docs;
        },
        error: (err) => {
          this.presentToast('Failed to load documents for appointment.');
        }
      });
    });
  }

  uploadDocument(event: Event, appointmentId: string, doctorId: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploading[appointmentId] = true;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      const doc: Document = {
        appointmentId,
        doctorId,
        filename: file.name,
        fileData: base64Data,
        mimeType: file.type,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      this.sqliteStorageService.saveDocument(doc).subscribe({
        next: () => {
          this.documents[appointmentId] = this.documents[appointmentId] || [];
          this.documents[appointmentId].push(doc);
          this.isUploading[appointmentId] = false;
          this.presentToast('Document uploaded successfully.', 'success');
        },
        error: (err) => {
          this.isUploading[appointmentId] = false;
          this.presentToast('Failed to upload document.');
        }
      });
    };
    reader.onerror = () => {
      this.isUploading[appointmentId] = false;
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
