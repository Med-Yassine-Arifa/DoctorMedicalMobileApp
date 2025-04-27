import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService } from '../../../services/doctor.service';
import { AvailabilitySlot, DoctorUser } from '../../../models/user.model';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  saveOutline,
  addOutline,
  trashOutline,
  calendarOutline,
  timeOutline,
  mailOutline,
  lockClosedOutline as lockOutline,
  personOutline,
  callOutline,
  locationOutline,
  medkitOutline,
  cardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-doctor-form',
  templateUrl: './doctor-form.page.html',
  styleUrls: ['./doctor-form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class DoctorFormPage implements OnInit {
  doctorForm: FormGroup;
  isEditMode = false;
  doctorId: string | null = null;
  pageTitle = 'Add New Doctor';
  weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.doctorForm = this.createDoctorForm();

    addIcons({
      arrowBackOutline,
      saveOutline,
      addOutline,
      trashOutline,
      calendarOutline,
      timeOutline,
      mailOutline,
      lockOutline,
      personOutline,
      callOutline,
      locationOutline,
      medkitOutline,
      cardOutline
    });
  }

  ngOnInit() {
    this.doctorId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.doctorId;

    if (this.isEditMode) {
      this.pageTitle = 'Edit Doctor';
      this.loadDoctorData();
    }
  }

  createDoctorForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      profile: this.formBuilder.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        phone: ['', Validators.required],
        address: ['', Validators.required],
        specialization: ['', Validators.required],
        licenseNumber: ['', Validators.required]
      }),
      availability: this.formBuilder.array([])
    });
  }

  get availabilityArray(): FormArray {
    return this.doctorForm.get('availability') as FormArray;
  }

  addAvailabilitySlot() {
    const availabilityGroup = this.formBuilder.group({
      day: ['Monday', Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required]
    });

    this.availabilityArray.push(availabilityGroup);
  }

  removeAvailabilitySlot(index: number) {
    this.availabilityArray.removeAt(index);
  }

  async loadDoctorData() {
    if (!this.doctorId) return;

    const loading = await this.loadingController.create({
      message: 'Loading doctor data...',
      spinner: 'circles'
    });
    await loading.present();

    this.doctorService.getDoctor(this.doctorId).subscribe({
      next: (doctor: DoctorUser) => {
        if (doctor) {
          // Remove password field validators for edit mode
          this.doctorForm.get('password')?.clearValidators();
          this.doctorForm.get('password')?.updateValueAndValidity();

          // Patch form values
          this.doctorForm.patchValue({
            email: doctor.email,
            profile: {
              firstName: doctor.profile.firstName,
              lastName: doctor.profile.lastName,
              phone: doctor.profile.phone,
              address: doctor.profile.address,
              specialization: doctor.profile.specialization,
              licenseNumber: doctor.profile.licenseNumber
            }
          });

          // Clear and add availability slots
          this.availabilityArray.clear();
          if (doctor.availability && doctor.availability.length > 0) {
            doctor.availability.forEach(slot => {
              this.availabilityArray.push(
                this.formBuilder.group({
                  day: [slot.day, Validators.required],
                  startTime: [slot.startTime, Validators.required],
                  endTime: [slot.endTime, Validators.required]
                })
              );
            });
          }
        } else {
          this.presentToast('Doctor not found', 'danger');
          this.router.navigateByUrl('/admin/doctors');
        }
        loading.dismiss();
      },
      error: (error) => {
        console.error('Error loading doctor:', error);
        loading.dismiss();
        this.presentToast(error.message || 'Failed to load doctor data', 'danger');
        this.router.navigateByUrl('/admin/doctors');
      }
    });
  }

  async onSubmit() {
    if (this.doctorForm.invalid) {
      this.markFormGroupTouched(this.doctorForm);
      this.presentToast('Please fill in all required fields correctly', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Updating doctor...' : 'Creating doctor...',
      spinner: 'circles'
    });
    await loading.present();

    const formData = this.doctorForm.value;
    const doctorData = {
      email: formData.email,
      password: formData.password || undefined, // Omit password if empty
      firstName: formData.profile.firstName,
      lastName: formData.profile.lastName,
      phone: formData.profile.phone,
      address: formData.profile.address,
      specialization: formData.profile.specialization,
      licenseNumber: formData.profile.licenseNumber,
      availability: formData.availability
    };

    if (this.isEditMode && this.doctorId) {
      this.doctorService.updateDoctor(this.doctorId, doctorData).subscribe({
        next: () => {
          loading.dismiss();
          this.presentToast('Doctor updated successfully', 'success');
          this.router.navigateByUrl('/admin/doctors');
        },
        error: (error) => {
          loading.dismiss();
          console.error('Error updating doctor:', error);
          this.presentToast(error.message || 'Failed to update doctor', 'danger');
        }
      });
    } else {
      this.doctorService.createDoctor(doctorData).subscribe({
        next: () => {
          loading.dismiss();
          this.presentToast('Doctor created successfully', 'success');
          this.router.navigateByUrl('/admin/doctors');
        },
        error: (error) => {
          loading.dismiss();
          console.error('Error creating doctor:', error);
          this.presentToast(error.message || 'Failed to create doctor', 'danger');
        }
      });
    }
  }

  async deleteDoctor() {
    if (!this.doctorId) return;

    const alert = await this.alertController.create({
      header: 'Confirm Deletion',
      message: 'Are you sure you want to delete this doctor? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting doctor...',
              spinner: 'circles'
            });
            await loading.present();

            this.doctorService.deleteDoctor(this.doctorId!).subscribe({
              next: () => {
                loading.dismiss();
                this.presentToast('Doctor deleted successfully', 'success');
                this.router.navigateByUrl('/admin/doctors');
              },
              error: (error) => {
                loading.dismiss();
                console.error('Error deleting doctor:', error);
                this.presentToast(error.message || 'Failed to delete doctor', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl: any) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goBack() {
    this.router.navigateByUrl('/admin/doctors');
  }
}
