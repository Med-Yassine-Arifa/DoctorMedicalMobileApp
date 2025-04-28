import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DoctorService } from '../../../services/doctor.service';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  trashOutline,
  arrowBackOutline,
  searchOutline,
  closeCircleOutline,
  refreshOutline
} from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { DoctorUser } from '../../../models/user.model';
import { InfiniteScrollCustomEvent } from '@ionic/core';

@Component({
  selector: 'app-doctors-list',
  templateUrl: './doctors-list.page.html',
  styleUrls: ['./doctors-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DoctorsListPage implements OnInit {
  doctors: DoctorUser[] = [];
  filteredDoctors: DoctorUser[] = [];
  searchTerm = '';
  isLoading = false;
  page = 1;
  limit = 10;

  constructor(
    private router: Router,
    private doctorService: DoctorService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      addOutline,
      createOutline,
      trashOutline,
      arrowBackOutline,
      searchOutline,
      closeCircleOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    this.loadDoctors().then(r => {});
  }

  async loadDoctors(event?: InfiniteScrollCustomEvent) {
    const loading = await this.loadingController.create({
      message: 'Loading doctors...',
      spinner: 'circles'
    });
    await loading.present();

    this.isLoading = true;
    this.doctorService.getAllDoctors().subscribe({
      next: (doctors) => {
        const start = (this.page - 1) * this.limit;
        const newDoctors = doctors.slice(start, start + this.limit);
        this.doctors = [...this.doctors, ...newDoctors];
        this.filteredDoctors = [...this.doctors];
        this.isLoading = false;
        loading.dismiss();
        if (event) {
          event.target.complete();
          if (newDoctors.length < this.limit) {
            event.target.disabled = true;
          }
        }
        this.page++;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.isLoading = false;
        loading.dismiss();
        this.presentToast('Failed to load doctors. Please try again.', 'danger');
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  filterDoctors() {
    if (!this.searchTerm) {
      this.filteredDoctors = [...this.doctors];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredDoctors = this.doctors.filter(doctor =>
      doctor.email.toLowerCase().includes(term) ||
      doctor.profile.firstName.toLowerCase().includes(term) ||
      doctor.profile.lastName.toLowerCase().includes(term) ||
      (doctor.profile.specialization && doctor.profile.specialization.toLowerCase().includes(term))
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredDoctors = [...this.doctors];
  }

  navigateToCreate() {
    this.router.navigateByUrl('/admin/doctors/create');
  }

  navigateToEdit(doctorId: string) {
    this.router.navigateByUrl(`/admin/doctors/edit/${doctorId}`);
  }

  async confirmDelete(doctor: DoctorUser) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteDoctor(doctor.firebaseUid);
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteDoctor(doctorId: string) {
    const loading = await this.loadingController.create({
      message: 'Deleting doctor...',
      spinner: 'circles'
    });
    await loading.present();

    this.doctorService.deleteDoctor(doctorId).subscribe({
      next: () => {
        loading.dismiss();
        this.presentToast('Doctor deleted successfully', 'success');
        this.doctors = this.doctors.filter(d => d.firebaseUid !== doctorId);
        this.filteredDoctors = this.filteredDoctors.filter(d => d.firebaseUid !== doctorId);
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error deleting doctor:', error);
        this.presentToast('Failed to delete doctor. Please try again.', 'danger');
      }
    });
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

  goBack() {
    this.router.navigateByUrl('/admin/dashboard');
  }

  refresh() {
    this.page = 1;
    this.doctors = [];
    this.filteredDoctors = [];
    this.loadDoctors();
  }
}
