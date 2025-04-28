import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
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
    private doctorService: DoctorService
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

  loadDoctorCount() {
    this.doctorService.getAllDoctors().subscribe({
      next: (doctors) => {
        this.doctorCount = doctors.length;
      },
      error: (error) => {
        console.error('Error loading doctor count:', error);
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  logout() {
    this.authService.signOut().subscribe(() => {
      this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    });
  }
}
