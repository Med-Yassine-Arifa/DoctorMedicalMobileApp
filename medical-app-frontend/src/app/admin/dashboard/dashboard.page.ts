import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonicModule, ModalController} from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';
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
export class DashboardPage implements OnInit {
  doctorCount = 0;

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
  }

  ngOnInit() {
    //this.loadDoctorCount();
  }
/*
  loadDoctorCount() {
    this.doctorService.getAllDoctors().subscribe(doctors => {
      this.doctorCount = doctors.length;
    });
  }
*/

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  logout() {
    this.authService.signOut().subscribe(() => {
      this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    });
  }
}
