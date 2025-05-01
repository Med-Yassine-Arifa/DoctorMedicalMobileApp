import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import { Appointment } from 'src/app/models/appointment.model';

@Component({
  selector: 'app-reschedule-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Reschedule Appointment</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h3>Select New Date</h3>
      <div class="date-selector">
        <div *ngFor="let date of dates" (click)="selectDate(date.day)" [ngClass]="{'selected': selectedDate === date.day}">
          {{ date.label }} {{ date.day }}
        </div>
      </div>

      <h3>Select New Time</h3>
      <div class="time-selector">
        <div *ngFor="let time of times" (click)="selectTime(time)" [ngClass]="{'selected': selectedTime === time}">
          {{ time }}
        </div>
      </div>

      <ion-button expand="block" (click)="confirm()">Confirm Reschedule</ion-button>
    </ion-content>
  `,
  styles: [`
    .date-selector, .time-selector {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 10px 0;
    }
    .date-selector div, .time-selector div {
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      cursor: pointer;
    }
    .selected {
      background-color: var(--ion-color-primary);
      color: white;
    }
  `],
  imports: [
    IonicModule,
    NgForOf,
    NgIf,
    NgClass
  ],
  standalone: true
})
export class RescheduleModalComponent {
  @Input() appointment!: Appointment;
  dates: { day: number; label: string }[] = [];
  times: string[] = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  selectedDate: number | null = null;
  selectedTime: string | null = null;

  constructor(private modalController: ModalController) {
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

  dismiss() {
    this.modalController.dismiss();
  }

  confirm() {
    if (!this.selectedDate || !this.selectedTime) {
      return;
    }
    const appointmentDate = new Date('2025-04-30');
    appointmentDate.setDate(this.selectedDate);
    const dateStr = appointmentDate.toISOString().split('T')[0];
    this.modalController.dismiss({ date: dateStr, time: this.selectedTime });
  }
}
