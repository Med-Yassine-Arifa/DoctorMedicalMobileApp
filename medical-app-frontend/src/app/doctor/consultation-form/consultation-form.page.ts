import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../../services/consultation.service';
import { Consultation } from '../../models/consultation.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-consultation-form',
  templateUrl: './consultation-form.page.html',
  styleUrls: ['./consultation-form.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class ConsultationFormPage implements OnInit {
  consultationForm: FormGroup;
  isEditMode = false;
  consultationId?: string;
  selectedFiles: File[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
    private fb: FormBuilder,
    private alertController: AlertController
  ) {
    // Initialize the reactive form
    this.consultationForm = this.fb.group({
      appointmentId: ['', Validators.required],
      patientId: ['', Validators.required],
      diagnosis: ['', Validators.required],
      prescription: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    const routeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!(routeId && routeId !== 'new');
    if (this.isEditMode && routeId) {
      this.consultationId = routeId;
      this.loadConsultation(routeId);
    }
  }

  onFileChange(event: any) {
    const files: FileList = event.target.files;
    this.selectedFiles = [];
    for (let i = 0; i < files.length; i++) {
      this.selectedFiles.push(files.item(i)!);
    }
  }

  private loadConsultation(id: string) {
    this.consultationService.getConsultation(id)
      .subscribe({
        next: c => {
          this.consultationForm.patchValue({
            appointmentId: c.appointmentId,
            patientId: c.patientId,
            diagnosis: c.diagnosis,
            prescription: c.prescription,
            notes: c.notes
          });
        },
        error: err => {
          console.error('Error loading consultation:', err);
          this.presentAlert('Error', 'Failed to load consultation. Please try again.');
        }
      });
  }

  submit() {
    if (this.consultationForm.invalid) {
      this.presentAlert('Error', 'Please fill all required fields.');
      return;
    }

    const payload = this.consultationForm.value;

    if (this.isEditMode && this.consultationId) {
      // --- UPDATE flow ---
      console.log('Updating consultation id:', this.consultationId);
      this.consultationService.updateConsultation(this.consultationId, payload)
        .subscribe({
          next: () => {
            this.presentAlert('Success', 'Consultation updated successfully.')
              .then(() => this.router.navigateByUrl('/doctor/consultation-list'));
          },
          error: err => {
            console.error('Error updating consultation:', err);
            this.presentAlert('Error', err.message || 'Failed to update consultation.');
          }
        });
    } else {
      // --- CREATE flow ---
      console.log('Creating new consultation');
      this.consultationService.createConsultation(payload, this.selectedFiles)
        .subscribe({
          next: () => {
            this.presentAlert('Success', 'Consultation created successfully.')
              .then(() => this.router.navigateByUrl('/doctor/consultation-list'));
          },
          error: err => {
            console.error('Error creating consultation:', err);
            this.presentAlert('Error', err.message || 'Failed to create consultation.');
          }
        });
    }
  }

  cancel() {
    this.router.navigateByUrl('/doctor/consultation-list')
      .catch(err => {
        console.error('Navigation error:', err);
        this.presentAlert('Error', 'Failed to navigate back.');
      });
  }

  private async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
