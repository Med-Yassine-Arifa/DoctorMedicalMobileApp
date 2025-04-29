import { Component, OnInit } from '@angular/core';
import { ConsultationService } from '../../services/consultation.service';
import { Consultation } from '../../models/consultation.model';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-consultation-list',
  templateUrl: './consultation-list.page.html',
  styleUrls: ['./consultation-list.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule]
})
export class ConsultationListPage implements OnInit {
  consultations: Consultation[] = [];

  constructor(
      private consultationService: ConsultationService,
      private router: Router,
      private alertController: AlertController
  ) {
  }

  ngOnInit() {
    this.loadConsultations();
  }

  loadConsultations() {
    this.consultationService.getDoctorConsultations().subscribe({
      next: (consultations) => {
        this.consultations = consultations;
      },
      error: (error) => {
        console.error('Error loading consultations:', error);
        this.presentAlert('Error', 'Failed to load consultations.');
      }
    });
  }

  navigateToForm(consultationId?: string) {
    const path = consultationId
        ? `doctor/consultation-form/${consultationId}`
        : 'doctor/consultation-form/new';
    console.log('Navigating to:', path);
    this.router.navigateByUrl(path).catch(err => {
      console.error('Navigation error:', err);
      this.presentAlert('Error', 'Failed to navigate to consultation form.');
    });
  }

  async deleteConsultation(id: string) {
    console.log('Consultation ID to delete:', id);
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this consultation?',
      buttons: [
        {text: 'Cancel', role: 'cancel'},
        {
          text: 'Delete',
          handler: () => {
            this.consultationService.deleteConsultation(id).subscribe({
              next: () => {
                this.loadConsultations();
                this.presentAlert('Success', 'Deleted successfully');
              },
              error: (err) => {
                console.error('Delete error:', err);
                this.presentAlert('Error', err.message);
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
