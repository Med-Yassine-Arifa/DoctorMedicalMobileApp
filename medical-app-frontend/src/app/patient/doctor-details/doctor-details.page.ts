import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorUser } from '../../models/user.model';
import { IonicModule, ToastController } from '@ionic/angular';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import {FormsModule} from "@angular/forms";
import {PatientService} from "../../services/patient.service";
import {Appointment} from "../../models/appointment.model";

@Component({
  selector: 'app-doctor-details',
  templateUrl: './doctor-details.page.html',
  styleUrls: ['./doctor-details.page.scss'],
  imports: [
    IonicModule,
    NgClass,
    NgForOf,
    NgIf,
    FormsModule
  ],
  standalone: true
})
export class DoctorDetailsPage implements OnInit {
  doctor:  DoctorUser | null = null;
  isLoading = true;
  highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = [];
  times: string[] = [];
  selectedDate: string | null = null;
  selectedTime: string | null = null;
  reason: string = '';
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private router: Router,
    private appointmentService: AppointmentService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    const doctorId = this.route.snapshot.queryParams['doctorId'];
    if (doctorId) {
      this.patientService.getDoctor(doctorId).subscribe(
        (doctor) => {
          this.doctor = ({
            ...doctor,
            image : history.state.doctor.image,
            distance: history.state.doctor.distance,
            rating: history.state.doctor.rating
          })

          this.generateHighlightedDates();
          this.isLoading = false;
        },
        (error) => {
          this.errorMessage = 'Failed to load doctor details.';
          this.isLoading = false;
        }
      );
    } else {
      this.errorMessage = 'Doctor ID not provided.';
      this.isLoading = false;
    }
  }


  generateHighlightedDates() {
    if (!this.doctor || !this.doctor.availability) return;

    const availableDays = this.doctor.availability.map(slot => slot.day);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 1); // Limit to one month

    this.highlightedDates = [];

    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleString('en-US', { weekday: 'long' });
      if (availableDays.includes(dayName)) {
        const dateStr = d.toISOString().split('T')[0];
        this.highlightedDates.push({
          date: dateStr,
          textColor: 'white',
          backgroundColor: '#28a745' // Green for available days
        });
      }
    }
  }

  onDateChange(event: any) {
    const selectedDateStr = event.detail.value.split('T')[0]; // e.g., "2025-05-10"
    this.selectedDate = selectedDateStr;
    this.times = [];
    this.selectedTime = null;

    const selectedDateObj = new Date(selectedDateStr);
    const dayName = selectedDateObj.toLocaleString('en-US', { weekday: 'long' });
    const availability = this.doctor!.availability.find(slot => slot.day === dayName);

    if (availability) {
      this.generateTimeSlots(availability.startTime, availability.endTime);
    }
  }

  // Generate 1-hour time slots
  generateTimeSlots(startTime: string, endTime: string) {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    const slots: string[] = [];
    let current = start;

    while (current < end) {
      slots.push(this.formatTime(current));
      current += 60; // 1-hour intervals
    }

    this.appointmentService.getAppointmentDoctorId(this.doctor!.firebaseUid,[ 'confirmed' ,'pending']).subscribe(
      (appointments: Appointment[]) => {
        const bookedTimes = appointments
          .filter((appt) => appt.date.startsWith(this.selectedDate!)) // Match selected date
          .map((appt) => appt.date.split('T')[1].substring(0, 5)); // Extract time (e.g., "09:00")

        this.times = slots.filter((slot) => !bookedTimes.includes(slot));
      },
      (error) => {
        this.errorMessage = 'Failed to load available time slots.';
        this.times = slots; // Fallback to all slots if fetch fails
      }
    );
  }

  // Parse time string to minutes
  parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Format minutes to time string
  formatTime(minutes: number): string {
    const hours = (Math.floor(minutes / 60));
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Select a time slot
  selectTime(time: string) {
    this.selectedTime = time;
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  bookAppointment() {
    if (!this.selectedDate || !this.selectedTime || !this.doctor) {
      this.presentToast('Please select a date and time', 'danger');
      return;
    }

    if (!this.reason.trim()) {
      this.presentToast('Please provide a reason for the appointment', 'danger');
      return;
    }

    const selectedDate = `${this.selectedDate}`;

    const appointmentData = {
      doctorId: this.doctor!.firebaseUid,
      date: selectedDate,
      time: this.selectedTime,
      reason: this.reason
    };

    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentService.bookAppointment(appointmentData).subscribe({
      next: async (response) => {
        this.isLoading = false;
        await this.presentToast('Appointment request submitted. Awaiting doctor approval.');
        this.router.navigate(['/patient/appointments']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message;
        this.presentToast('Failed to book appointment. Please try again.', 'danger');
      }
    });
  }

}
