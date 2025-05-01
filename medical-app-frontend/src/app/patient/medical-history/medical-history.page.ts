import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { ConsultationService } from '../../services/consultation.service';
import { Appointment } from '../../models/appointment.model';
import { Consultation } from '../../models/consultation.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-medical-history',
  templateUrl: './medical-history.page.html',
  styleUrls: ['./medical-history.page.scss'],
  imports: [
    IonicModule,
    NgForOf,
    NgIf,
    DatePipe
  ],
  standalone: true
})
export class MedicalHistoryPage implements OnInit {
  appointments: Appointment[] = [];
  consultations: Consultation[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private appointmentService: AppointmentService,
    private consultationService: ConsultationService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadMedicalHistory();
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

  loadMedicalHistory() {
    this.isLoading = true;
    this.errorMessage = '';

    // Load appointments
    this.appointmentService.getPatientAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loadConsultations();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message;
        this.presentToast('Failed to load appointments.');
      }
    });
  }

  loadConsultations() {
    this.consultationService.getPatientConsultations().subscribe({
      next: (consultations) => {
        this.consultations = consultations;
        this.isLoading = false;
      },
      error: (err : any ) => {
        this.isLoading = false;
        this.errorMessage = err.message;
        this.presentToast('Failed to load consultations.');
      }
    });
  }

  getConsultationForAppointment(appointmentId: string): Consultation | undefined {
    return this.consultations.find(c => c.appointmentId === appointmentId);
  }

  getDocumentUrl(consultationId: string, filename: string): string {
    return `${environment.apiUrl}/consultation/consultations/${consultationId}/documents/${filename}`;
  }
}
