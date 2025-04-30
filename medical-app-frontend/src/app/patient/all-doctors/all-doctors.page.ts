import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons, IonCard, IonCardContent,
  IonContent,
  IonHeader, IonIcon, IonImg,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {PatientService} from "../../services/patient.service";
import {DoctorUser} from "../../models/user.model";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-all-doctors',
  templateUrl: './all-doctors.page.html',
  styleUrls: ['./all-doctors.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonSpinner, IonText, IonButtons, IonBackButton, IonCard, IonImg, IonCardContent, IonIcon, RouterLink]
})
export class AllDoctorsPage implements OnInit {
  doctors: (DoctorUser & { image: string; distance: string })[] = [];
  selectedSpecialization: string | undefined = undefined;
  isLoading: boolean = false;
  errorMessage: string = '';


  constructor(
    private patientService: PatientService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    // Get the selected specialization from query parameters
    this.route.queryParams.subscribe(params => {
      this.selectedSpecialization = params['specialization'] || undefined;
      this.loadDoctors();
    });
  }

  loadDoctors() {
    this.errorMessage = '';
    this.isLoading = true;
    this.patientService.getAllDoctors().subscribe({
      next: (doctors) => {
        console.log('All doctors received:', doctors);
       this.doctors = doctors.map(doctor => ({
          ...doctor,
          image: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100)}.jpg`,
          distance: `${(Math.random() * 3 + 0.5).toFixed(1)}km away`
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load all doctors:', err);
        this.errorMessage = 'Unable to load doctors. Please try again later.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewDoctorDetails(doctor: DoctorUser) {
    this.router.navigate(['patient/doctor-details'], {
      queryParams: { doctor: JSON.stringify(doctor) }
    });
  }
}
