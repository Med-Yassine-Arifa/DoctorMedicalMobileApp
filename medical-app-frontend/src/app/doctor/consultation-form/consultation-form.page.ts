import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ConsultationService } from '../../services/consultation.service';
import { Consultation } from '../../models/consultation.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Appointment } from '../../models/appointment.model';

@Component({
  selector: 'app-consultation-form',
  templateUrl: './consultation-form.page.html',
  styleUrls: ['./consultation-form.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule]
})
export class ConsultationFormPage implements OnInit {
  @Input() appointment: Appointment | null = null;
  @Input() consultation: Consultation | null = null;
  @Output() consultationCreated = new EventEmitter<void>();
  @Output() consultationUpdated = new EventEmitter<void>();
  consultationForm: FormGroup;
  selectedFiles: File[] = [];
  isSubmitting: boolean = false;

  constructor(
    private consultationService: ConsultationService,
    private fb: FormBuilder,
    private alertController: AlertController
  ) {
    this.consultationForm = this.fb.group({
      appointmentId: ['', Validators.required],
      patientId: ['', Validators.required],
      diagnosis: ['', Validators.required],
      prescription: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    console.log('ConsultationFormPage initialized with appointment:', this.appointment);
    console.log('ConsultationFormPage initialized with consultation:', this.consultation);

    if (this.consultation) {
      this.consultationForm.patchValue({
        appointmentId: this.consultation.appointmentId,
        patientId: this.consultation.patientId,
        diagnosis: this.consultation.diagnosis,
        prescription: this.consultation.prescription,
        notes: this.consultation.notes
      });
    } else if (this.appointment) {
      this.consultationForm.patchValue({
        appointmentId: this.appointment.id,
        patientId: this.appointment.patientId
      });
    } else {
      console.error('No appointment or consultation provided to ConsultationFormPage');
      this.presentAlert('Error', 'Failed to initialize form. No appointment data provided.');
    }
  }

  onFileChange(event: any) {
    const files: FileList = event.target.files;
    this.selectedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (file) this.selectedFiles.push(file);
    }
  }

  submit() {
    if (this.consultationForm.invalid) {
      this.presentAlert('Error', 'Please fill all required fields.');
      return;
    }

    this.isSubmitting = true;
    const payload = this.consultationForm.value;

    if (this.consultation) {
      this.consultationService.updateConsultation(this.consultation.id, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.consultationUpdated.emit();
          this.presentAlert('Success', 'Consultation updated successfully.');
        },
        error: (err) => {
          this.isSubmitting = false;
          this.presentAlert('Error', err.message || 'Failed to update consultation.');
        }
      });
    } else {
      this.consultationService.createConsultation(payload, this.selectedFiles).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.consultationCreated.emit();
          this.consultationForm.reset();
          this.selectedFiles = [];
          this.presentAlert('Success', 'Consultation created successfully.');
        },
        error: (err) => {
          this.isSubmitting = false;
          this.presentAlert('Error', err.message || 'Failed to create consultation.');
        }
      });
    }
  }

  cancel() {
    this.presentAlert('Cancel', 'Are you sure you want to cancel?', () => {
      window.history.back();
    });
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
}
