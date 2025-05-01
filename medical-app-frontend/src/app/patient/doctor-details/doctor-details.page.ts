import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorUser } from '../../models/user.model';
import { IonicModule, ToastController } from '@ionic/angular';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import {FormsModule} from "@angular/forms";

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
  doctor: (DoctorUser & { image: string; distance: string; rating: number }) | null = null;
  dates: { day: number; label: string }[] = [];
  times: string[] = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  selectedDate: number | null = null;
  selectedTime: string | null = null;
  reason: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Get doctor data from navigation parameters
    this.route.queryParams.subscribe(params => {
      if (params['doctor']) {
        this.doctor = JSON.parse(params['doctor']);
      }
    });

    // Generate dates starting from today (April 30, 2025)
    const today = new Date('2025-04-30');
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      this.dates.push({
        day: date.getDate(),
        label: dayLabels[date.getDay()]
      });
    }
  }

  selectDate(day: number) {
    this.selectedDate = this.selectedDate === day ? null : day;
  }

  selectTime(time: string) {
    this.selectedTime = this.selectedTime === time ? null : time;
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

    const appointmentDate = new Date('2025-04-30');
    appointmentDate.setDate(this.selectedDate);
    const dateStr = appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const appointmentData = {
      doctorId: this.doctor.firebaseUid,
      date: dateStr,
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

  sendMessage() {
    console.log(`Sending message to ${this.doctor?.profile.firstName} ${this.doctor?.profile.lastName}`);
    // Placeholder for sending a message
  }
}
