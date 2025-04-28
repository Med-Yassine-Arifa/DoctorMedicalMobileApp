import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { getAuth } from 'firebase/auth';
import {
  peopleOutline,
  personAddOutline,
  logOutOutline,
  homeOutline,
  menuOutline,
  statsChartOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class DashboardPage implements OnInit, OnDestroy {
  doctorCount = 0;
  private doctorUpdateSubscription: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private doctorService: DoctorService,
    private toastController: ToastController
  ) {
    addIcons({
      peopleOutline,
      personAddOutline,
      logOutOutline,
      homeOutline,
      menuOutline,
      statsChartOutline
    });
    this.doctorUpdateSubscription = this.doctorService.doctorListUpdated$.subscribe(() => {
      this.loadDoctorCount();
    });
  }

  ngOnInit() {
    this.loadDoctorCount();
  }

  ngOnDestroy() {
    this.doctorUpdateSubscription.unsubscribe();
  }

  async loadDoctorCount() {
    const auth = getAuth();
    if (!auth.currentUser) {
      await this.presentToast('Please log in to view dashboard.', 'danger');
      this.logout();
      return;
    }
    try {
      this.doctorService.getAllDoctors().subscribe({
        next: (doctors) => {
          this.doctorCount = doctors.length;
        },
        error: async (error) => {
          console.error('Error loading doctor count:', error);
          if (error.status === 401) {
            await this.presentToast('Unauthorized access. Please log in again.', 'danger');
            this.logout();
          } else {
            await this.presentToast('Failed to load doctor count.', 'danger');
          }
        }
      });
    } catch (error) {
      console.error('Error initiating doctor count load:', error);
      await this.presentToast('Failed to load doctor count.', 'danger');
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

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  logout() {
    this.authService.signOut().subscribe({
      next: () => {
        this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      },
      error: async (error) => {
        console.error('Error during logout:', error);
        await this.presentToast('Failed to log out.', 'danger');
      }
    });
  }
}
