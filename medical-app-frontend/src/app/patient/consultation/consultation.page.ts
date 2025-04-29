import { Component, OnInit } from '@angular/core';
import { ConsultationService } from '../../services/consultation.service';
import { Consultation } from '../../models/consultation.model';
import { AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.page.html',
  styleUrls: ['./consultation.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ConsultationPage implements OnInit {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  doctors: string[] = [];
  selectedDoctor: string = '';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private consultationService: ConsultationService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadConsultations();
  }

  loadConsultations() {
    this.consultationService.getPatientConsultations().subscribe({
      next: (consultations) => {
        this.consultations = consultations;
        this.filteredConsultations = [...consultations];
        this.doctors = [...new Set(consultations.map(c => c.doctorName))];
        this.applySort();
      },
      error: (error) => {
        console.error('Error loading consultations:', error);
        this.presentAlert('Error', 'Failed to load consultations.');
      }
    });
  }

  filterByDoctor() {
    if (this.selectedDoctor) {
      this.filteredConsultations = this.consultations.filter(c => c.doctorName === this.selectedDoctor);
    } else {
      this.filteredConsultations = [...this.consultations];
    }
    this.applySort();
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applySort();
  }

  applySort() {
    this.filteredConsultations.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
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
