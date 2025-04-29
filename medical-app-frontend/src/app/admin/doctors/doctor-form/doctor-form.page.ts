import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService} from "../../../services/doctor.service";
import {AvailabilitySlot , DoctorUser} from "../../../models/user.model";
import { getAuth } from 'firebase/auth';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline,
  closeOutline,
  calendarOutline,
  personOutline,
  mailOutline,
  lockClosedOutline,
  callOutline,
  locationOutline,
  medkitOutline,
  cardOutline,
  addOutline,
  trashOutline,
  timeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-doctor-form',
  templateUrl: './doctor-form.page.html',
  styleUrls: ['./doctor-form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class DoctorFormPage implements OnInit {
  doctorForm: FormGroup;
  doctor: DoctorUser = {
    firebaseUid: '',
    email: '',
    role: 'doctor',
    profile: {
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      specialization: '',
      licenseNumber: ''
    },
    availability: []
  };
  isEditMode = false;
  doctorId: string | null = null;
  weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  specializations = [
    'Neurologist', 'Cardiologist', 'Dermatologist', 'Obstetrics and gynaecology', 'Oncologist',
    'Endocrinologist', 'General surgery', 'Psychiatrist', 'Ophthalmologist', 'Emergency medicine',
    'Family medicine', 'Gastroenterologist', 'Pediatrics', 'Radiologist', 'Orthopaedist',
    'Pathology', 'Allergist', 'Anesthesiology', 'Hematologist', 'Immunology',
    'Internal medicine', 'Nephrologist', 'Pulmonologist', 'Anesthesiologist'
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    private toastController: ToastController,
    private fb: FormBuilder
  ) {
    addIcons({
      checkmarkOutline,
      closeOutline,
      calendarOutline,
      personOutline,
      mailOutline,
      lockClosedOutline,
      callOutline,
      locationOutline,
      medkitOutline,
      cardOutline,
      addOutline,
      trashOutline,
      timeOutline
    });
    this.doctorForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      profile: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        phone: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
        address: ['', Validators.required],
        specialization: ['', Validators.required],
        licenseNumber: ['', [Validators.required, Validators.pattern(/^\d{15}$/)]]
      }),
      availability: this.fb.array([])
    });
  }

  ngOnInit() {
    this.doctorId = this.route.snapshot.paramMap.get('id');
    if (this.doctorId) {
      this.isEditMode = true;
      this.doctorForm.get('password')?.clearValidators();
      this.doctorForm.get('password')?.updateValueAndValidity();
      this.loadDoctor();
    }
  }

  get availabilityArray(): FormArray {
    return this.doctorForm.get('availability') as FormArray;
  }

  loadDoctor() {
    if (this.doctorId) {
      this.doctorService.getDoctor(this.doctorId).subscribe({
        next: (doctor) => {
          this.doctor = doctor;
          this.doctorForm.patchValue({
            email: doctor.email,
            profile: doctor.profile
          });
          doctor.availability.forEach(slot => {
            this.availabilityArray.push(this.createAvailabilitySlot(slot));
          });
        },
        error: async (error) => {
          console.error('Error loading doctor:', error);
          await this.presentToast('Failed to load doctor', 'danger');
        }
      });
    }
  }

  createAvailabilitySlot(slot: AvailabilitySlot = { day: '', startTime: '', endTime: '' }): FormGroup {
    return this.fb.group({
      day: [slot.day, Validators.required],
      startTime: [slot.startTime, Validators.required],
      endTime: [slot.endTime, Validators.required]
    });
  }

  addAvailabilitySlot() {
    this.availabilityArray.push(this.createAvailabilitySlot());
  }

  removeAvailabilitySlot(index: number) {
    this.availabilityArray.removeAt(index);
  }

  async submitForm() {
    const auth = getAuth();
    if (!auth.currentUser) {
      await this.presentToast('Please log in to perform this action.', 'danger');
      this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return;
    }

    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    const doctorData = {
      email: this.doctorForm.value.email,
      password: this.isEditMode ? undefined : this.doctorForm.value.password,
      firstName: this.doctorForm.value.profile.firstName,
      lastName: this.doctorForm.value.profile.lastName,
      phone: this.doctorForm.value.profile.phone,
      address: this.doctorForm.value.profile.address,
      specialization: this.doctorForm.value.profile.specialization,
      licenseNumber: this.doctorForm.value.profile.licenseNumber,
      availability: this.doctorForm.value.availability
    };

    try {
      if (this.isEditMode && this.doctorId) {
        this.doctorService.updateDoctor(this.doctorId, doctorData).subscribe({
          next: () => {
            this.presentToast('Doctor updated successfully', 'success');
            //this.doctorService.notifyDoctorListUpdate();
            this.router.navigateByUrl('/admin/doctors');
          },
          error: async (error) => {
            console.error('Error updating doctor:', error);
            if (error.status === 401) {
              await this.presentToast('Unauthorized access. Please log in again.', 'danger');
              this.router.navigateByUrl('/auth/login', { replaceUrl: true });
            } else {
              await this.presentToast('Failed to update doctor', 'danger');
            }
          }
        });
      } else {
        this.doctorService.createDoctor(doctorData).subscribe({
          next: () => {
            this.presentToast('Doctor created successfully', 'success');
            //this.doctorService.notifyDoctorListUpdate();
            this.router.navigateByUrl('/admin/doctors');
          },
          error: async (error) => {
            console.error('Error creating doctor:', error);
            if (error.status === 401) {
              // Attempt to refresh token and retry once
              try {
                await auth.currentUser?.getIdToken(true);
                this.doctorService.createDoctor(doctorData).subscribe({
                  next: () => {
                    this.presentToast('Doctor created successfully', 'success');
                    this.doctorService.notifyDoctorListUpdate();
                    this.router.navigateByUrl('/admin/doctors');
                  },
                  error: async (err) => {
                    console.error('Retry failed:', err);
                    await this.presentToast('Unauthorized access. Please log in again.', 'danger');
                    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
                  }
                });
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                await this.presentToast('Unauthorized access. Please log in again.', 'danger');
                this.router.navigateByUrl('/auth/login', { replaceUrl: true });
              }
            } else {
              await this.presentToast('Failed to create doctor', 'danger');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error initiating doctor operation:', error);
      await this.presentToast('Failed to perform operation', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  cancel() {
    this.router.navigateByUrl('/admin/doctors');
  }
}
