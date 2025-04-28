import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-doctors-list',
  templateUrl: './doctors-list.page.html',
  styleUrls: ['./doctors-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DoctorsListPage implements OnInit, OnDestroy {
  doctors: DoctorUser[] = [];
  filteredDoctors: DoctorUser[] = [];
  searchTerm = '';
  isLoading = false;
  page = 1;
  limit = 10;
  private doctorUpdateSubscription: Subscription;

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
    this.doctorUpdateSubscription = this.doctorService.doctorListUpdated$.subscribe(() => {
      this.refresh();
    });
  }

  ngOnInit() {
    this.loadDoctors();
  }

  ngOnDestroy() {
    this.doctorUpdateSubscription.unsubscribe();
  }

  async loadDoctors(event?: InfiniteScrollCustomEvent) {
    const auth = getAuth();
    if (!auth.currentUser) {
      await this.presentToast('Please log in to view doctors.', 'danger');
      this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return;
    }

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
      error: async (error) => {
        console.error('Error loading doctors:', error);
        this.isLoading = false;
        loading.dismiss();
        if (error.status === 401) {
          await this.presentToast('Unauthorized access. Please log in again.', 'danger');
          this.router.navigateByUrl('/auth/login', { replaceUrl: true });
        } else {
          await this.presentToast('Failed to load doctors. Please try again.', 'danger');
        }
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
        this.doctorService.notifyDoctorListUpdate();
      },
      error: async (error) => {
        loading.dismiss();
        console.error('Error deleting doctor:', error);
        if (error.status === 401) {
          await this.presentToast('Unauthorized access. Please log in again.', 'danger');
          this.router.navigateByUrl('/auth/login', { replaceUrl: true });
        } else {
          await this.presentToast('Failed to delete doctor. Please try again.', 'danger');
        }
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
