import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DoctorService } from '../../../services/doctor.service';
import { AuthService } from '../../../services/auth.service';
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
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import {
  IonButton,
  IonButtons,
  IonContent, IonFab, IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll, IonInfiniteScrollContent,
  IonTitle,
  IonToolbar,
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-doctors-list',
  templateUrl: './doctors-list.page.html',
  styleUrls: ['./doctors-list.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonContent, IonInfiniteScroll, IonInfiniteScrollContent, IonFabButton, IonFab]
})
export class DoctorsListPage implements OnInit, OnDestroy {
  doctors: DoctorUser[] = [];
  filteredDoctors: DoctorUser[] = [];
  searchTerm = '';
  isLoading = false;
  page = 1;
  limit = 10;
  private doctorUpdateSubscription: Subscription;
  private authSubscription: Subscription;
  private loadDoctorsTrigger = new BehaviorSubject<void>(undefined);
  private loadDoctorsSubscription: Subscription;

  constructor(
    private router: Router,
    private doctorService: DoctorService,
    private authService: AuthService,
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
      console.log('Doctor list update triggered');
      this.refresh();
    });
    this.authSubscription = this.authService.user$.subscribe(user => {
      console.log('Auth state changed:', user ? user.firebaseUid : 'No user');
      if (user) {
        this.loadDoctorsTrigger.next();
      } else {
        this.presentToast('Please log in to view doctors.', 'danger');
        this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      }
    });
    this.loadDoctorsSubscription = this.loadDoctorsTrigger.pipe(
      debounceTime(100)
    ).subscribe(() => {
      if (!this.isLoading) {
        this.loadDoctors();
      }
    });

  }

  ngOnInit() {
    console.log('DoctorsListPage: ngOnInit');
    const user = this.authService.getCurrentUser();
    if (user) {
      this.loadDoctorsTrigger.next();
    }
  }

  ngOnDestroy() {
    console.log('DoctorsListPage: ngOnDestroy');
    this.doctorUpdateSubscription.unsubscribe();
    this.authSubscription.unsubscribe();
    this.loadDoctorsSubscription.unsubscribe();
  }

  async loadDoctors(event?: InfiniteScrollCustomEvent) {
    console.log('loadDoctors called');
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.warn('No user logged in during loadDoctors');
      await this.presentToast('Please log in to view doctors.', 'danger');
      this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return;
    }
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading doctors...',
      spinner: 'circles'
    });
    await loading.present();

    this.doctorService.getAllDoctors().subscribe({
      next: (doctors) => {
        console.log('Doctors loaded:', doctors.length);
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
          console.log('401 error detected, waiting for interceptor retry');
          await this.presentToast('Session expired. Please log in again.', 'danger');
          this.router.navigateByUrl('/auth/login', { replaceUrl: true });
        } else if (error.status === 0) {
          console.error('Network or CORS error');
          await this.presentToast('Unable to connect to the server. Please check your network or try again later.', 'danger');
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
    console.log('Filtering doctors with term:', this.searchTerm);
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
    console.log('Clearing search');
    this.searchTerm = '';
    this.filteredDoctors = [...this.doctors];
  }

  navigateToCreate() {
    console.log('Navigating to create doctor');
    this.router.navigateByUrl('/admin/doctors/create');
  }

  navigateToEdit(doctorId: string) {
    console.log(`Navigating to edit doctor: ${doctorId}`);
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
    console.log(`Deleting doctor: ${doctorId}`);
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
        } else if (error.status === 0) {
          await this.presentToast('Unable to connect to the server. Please check your network or try again later.', 'danger');
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
    console.log('Back button clicked');
    const user = this.authService.getCurrentUser();
    if (user) {
      console.log('Navigating to /admin/dashboard');
      this.router.navigateByUrl('/admin/dashboard', { replaceUrl: true }).catch(err => {
        this.doctorService.notifyDoctorListUpdate();
        console.error('Navigation error:', err);
        this.presentToast('Failed to navigate back.', 'danger');
      });
    } else {
      console.warn('No user authenticated, redirecting to login');
      this.presentToast('Please log in to continue.', 'danger');
      this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    }
  }

  refresh() {
    console.log('Refreshing doctors list');
    this.page = 1;
    this.doctors = [];
    this.filteredDoctors = [];
    this.loadDoctorsTrigger.next();
  }
}
