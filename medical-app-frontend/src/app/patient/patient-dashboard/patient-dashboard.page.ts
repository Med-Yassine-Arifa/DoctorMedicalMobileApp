import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { PatientService } from '../../services/patient.service';
import {IonicModule, ModalController} from '@ionic/angular';
import {Router, RouterLink} from '@angular/router';
import { DoctorUser, PatientUser } from '../../models/user.model';
import {FormsModule} from "@angular/forms";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import { addIcons} from "ionicons";
import {
  calendar,
  chatbubbles,
  home,
  homeOutline,
  logOutOutline, menuOutline,
  peopleOutline,
  personAddOutline,
  settings, statsChartOutline
} from "ionicons/icons";

@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './patient-dashboard.page.html',
  styleUrls: ['./patient-dashboard.page.scss'],
  standalone: true ,
  imports: [IonicModule, FormsModule, NgForOf, NgClass, NgIf]
})
export class PatientDashboardPage implements OnInit {
  userName: string = '';
  specializations: { name: string; image: string }[] = [
    { name: 'Dermatologist', image: 'assets/images/specialty/allergy.png' },
    { name: 'Neurologist', image: 'assets/images/specialty/Neurologist.png' },
    { name: 'Gynaecology', image: 'assets/images/specialty/gynecology.png' },
    { name: 'Oncologist', image: 'assets/images/specialty/oncologist.png' },
    { name: 'Cardiologist', image: 'assets/images/specialty/Cardiologist.png' },
    { name: 'Ophthalmologist', image: 'assets/images/specialty/eye-test.png' },
    { name: 'Endocrinologist', image: 'assets/images/specialty/endocrine.png'},
    { name: 'Psychiatry', image: 'assets/images/specialty/psychiatrist.png' },
    { name: 'Emergency medicine', image: 'assets/images/specialty/first-aid-kit.png' },
    { name: 'Family medicine', image: 'assets/images/specialty/medicine.png' },
    { name: 'Gastroenterologist', image: 'assets/images/specialty/digestion.png' },
    { name: 'Radiologist', image: 'assets/images/specialty/img_6.png' },
    { name: 'Orthopaedist', image: 'assets/images/specialty/orthopaedist.png'},
    { name: 'Pathology', image: 'assets/images/specialty/img_3.png'},
    { name: 'Allergist', image: 'assets/images/specialty/img.png'},
    { name: 'Anesthesiology', image: 'assets/images/specialty/img_4.png' },
    { name: 'General surgery', image: 'assets/images/specialty/img_5.png' },
    { name: 'Hematologist', image: 'assets/images/specialty/hematologist.png' },
    { name: 'Immunology', image: 'assets/images/specialty/img_1.png'},
    { name: 'Internal medicine', image: 'assets/images/specialty/internal medicine.png' },
    { name: 'Nephrologist', image: 'assets/images/specialty/img_2.png' },
    { name: 'Pediatrics', image: 'assets/images/specialty/patient.png' },
  ];
  displayedSpecializations: { name: string; image: string }[] = [];
  doctors: DoctorUser[] = [];
  filteredDoctors: DoctorUser[] = [];
  selectedSpecialization: string | undefined = undefined;
  isSpecializationsModalOpen: boolean = false;
  searchQuery: string = '';
  searchTerm: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private patientService: PatientService,
    private modalController: ModalController,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      peopleOutline,
      personAddOutline,
      logOutOutline,
      homeOutline,
      menuOutline,
      statsChartOutline,
      home,
      calendar,
      chatbubbles,
      settings
    })
  }

  ngOnInit() {
    // Fetch user name
    const user = this.authService.getCurrentUser() as PatientUser | null;
    this.userName = user && user.role === 'patient' ? user.profile.firstName || 'Patient' : 'Patient';

    // Display first three specializations initially
    this.displayedSpecializations = this.specializations.slice(0, 3);

    // Fetch initial doctors
    this.loadDoctors();
  }

  loadDoctors(specialization?: string) {
    this.errorMessage = ''; // Reset error message
    this.isLoading = true;
    this.patientService.getPopularDoctors(specialization).subscribe({
      next: (doctors) => {
        console.log('Doctors received from backend:', doctors);
        this.doctors = doctors;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load doctors:', err);
        this.errorMessage = 'Unable to load doctors. Please try again later.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters() {
    let filtered = [...this.doctors];

    // Filter by single specialization
    if (this.selectedSpecialization) {
      const normalizedSelected = this.selectedSpecialization.toLowerCase().trim();
      filtered = filtered.filter(doctor => {
        const doctorSpec = (doctor.profile.specialization || '').toLowerCase().trim();
        const match = doctorSpec === normalizedSelected;
        console.log(`Doctor: ${doctor.profile.firstName} ${doctor.profile.lastName}, Specialization: ${doctorSpec}, Match: ${match}`);
        return match;
      });
    }

    if (this.searchTerm) {
      filtered = filtered.filter(doctor =>
        `${doctor.profile.firstName} ${doctor.profile.lastName}`
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredDoctors = filtered.slice(0, 3); // Ensure only 3 doctors are displayed
    console.log('Filtered doctors:', this.filteredDoctors);
    this.cdr.detectChanges();
  }

  openSpecializationsModal() {
    this.isSpecializationsModalOpen = true;
  }

  filterBySpecialization(specialization: string) {
    // Toggle selection: if already selected, deselect; otherwise, select this one
    if (this.selectedSpecialization === specialization) {
      this.selectedSpecialization = undefined; // Deselect
    } else {
      this.selectedSpecialization = specialization; // Select new one
    }
    this.loadDoctors(this.selectedSpecialization);
    this.isSpecializationsModalOpen = false; // Close modal after selection
  }

  viewAllDoctors() {
    this.errorMessage = '';
    this.isLoading = true;
    this.patientService.getAllDoctors(this.selectedSpecialization).subscribe({
      next: (doctors) => {
        console.log('All doctors received:', doctors);
        this.doctors = doctors;
        this.applyFilters();
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
  NavigateToAllDoctors() {
    this.router.navigate(['/patient/all-doctors']);
  }
  onSearch() {
    this.searchTerm = this.searchQuery.trim();
    if (this.searchTerm === '') {
      this.loadDoctors(this.selectedSpecialization);
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;
    this.patientService.searchDoctors(this.searchTerm).subscribe({
      next: (doctors) => {
        console.log('Search results:', doctors);
        this.doctors = doctors;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to search doctors:', err);
        this.errorMessage = 'Unable to search doctors. Please try again later.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewDoctorDetails(doctor: DoctorUser) {
    this.router.navigate(['/doctor-details'], {
      queryParams: { doctor: JSON.stringify(doctor) }
    });
  }
}
