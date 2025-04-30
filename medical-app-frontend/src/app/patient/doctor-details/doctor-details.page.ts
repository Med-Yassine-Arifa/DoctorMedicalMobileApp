import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton, IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {DoctorUser} from "../../models/user.model";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-doctor-details',
  templateUrl: './doctor-details.page.html',
  styleUrls: ['./doctor-details.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonImg, IonIcon, IonBackButton, IonButtons]
})
export class DoctorDetailsPage implements OnInit {
  doctor: (DoctorUser & { image: string; distance: string; rating: number }) | null = null;
  dates: { day: number; label: string }[] = [];
  times: string[] = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'];
  selectedDate: number | null = null;
  selectedTime: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Get doctor data from navigation parameters
    this.route.queryParams.subscribe(params => {
      if (params['doctor']) {
        this.doctor = JSON.parse(params['doctor']);
      }
    });


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

  sendMessage() {
    console.log(`Sending message to ${this.doctor?.profile.firstName} ${this.doctor?.profile.lastName}`);
    // Placeholder for sending a message
  }

  bookAppointment() {
    if (!this.selectedDate || !this.selectedTime) {
      console.log('Please select a date and time');
      return;
    }
    console.log(`Booking appointment with ${this.doctor?.profile.firstName} ${this.doctor?.profile.lastName} on ${this.selectedDate} at ${this.selectedTime}`);
    // Placeholder for booking an appointment
  }
}
