import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { ConsultationService } from '../../services/consultation.service';
import { Appointment } from '../../models/appointment.model';
import { Consultation } from '../../models/consultation.model';
import { ConsultationFormPage } from '../consultation-form/consultation-form.page';

@Component({
  selector: 'app-appointment-follow-up',
  templateUrl: './appointment-follow-up.page.html',
  styleUrls: ['./appointment-follow-up.page.scss'],
  imports: [
    IonicModule,
    NgIf,
    ConsultationFormPage,
    DatePipe,
    NgForOf
  ],
  standalone: true
})
export class AppointmentFollowUpPage implements OnInit {
  appointment: Appointment | null = null;
  consultation: Consultation | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  showConsultationForm: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private consultationService: ConsultationService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const appointmentId = this.route.snapshot.paramMap.get('id');
    if (appointmentId) {
      this.loadAppointment(appointmentId);
    } else {
      this.errorMessage = 'Invalid appointment ID';
      this.presentToast('Invalid appointment ID', 'danger');
    }
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  async presentAlert(header: string, message: string, confirmHandler?: () => void) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: confirmHandler
        ? [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Confirm', handler: confirmHandler }
        ]
        : ['OK']
    });
    await alert.present();
  }

  loadAppointment(appointmentId: string) {
    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentService.getAppointmentById(appointmentId).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.loadConsultation(appointmentId);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Appointment not found';
        this.presentToast('Failed to load appointment.', 'danger');
      }
    });
  }

  loadConsultation(appointmentId: string) {
    this.consultationService.getConsultationByAppointment(appointmentId).subscribe({

      next: (consultation) => {

        this.consultation = consultation;
        this.isLoading = false;
        this.showConsultationForm = false;
      },
      error: (err) => {
        if (err === null) {
          this.consultation = null;
          this.isLoading = false;
          this.showConsultationForm = false;
        } else {
          this.isLoading = false;
          this.errorMessage = err.message || 'Failed to load consultation';
          this.presentToast(this.errorMessage, 'danger');
        }
      }
    });
  }

  toggleConsultationForm() {
    this.showConsultationForm = !this.showConsultationForm;
  }

  onConsultationCreated() {
    this.loadConsultation(this.appointment!.id);
    this.showConsultationForm = false;
    this.presentToast('Consultation created successfully.');
  }

  onConsultationUpdated() {
    this.loadConsultation(this.appointment!.id);
    this.showConsultationForm = false;
    this.presentToast('Consultation updated successfully.');
  }

  editConsultation() {
    this.showConsultationForm = true;
  }

  deleteConsultation() {
    if (!this.consultation) return;

    this.presentAlert(
      'Confirm Delete',
      'Are you sure you want to delete this consultation?',
      () => {
        this.consultationService.deleteConsultation(this.consultation!.id).subscribe({
          next: () => {
            this.presentToast('Consultation deleted successfully.');
            this.consultation = null;
            this.showConsultationForm = false;
          },
          error: () => {
            this.presentToast('Failed to delete consultation.', 'danger');
          }
        });
      }
    );
  }

  downloadDocument(filename: string) {
    if (!this.consultation) return;

    this.consultationService.downloadDocument(this.consultation.id, filename).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.presentToast('Failed to download document.', 'danger');
      }
    });
  }
}
