import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { NgForOf, NgIf } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../models/appointment.model';
import { Router } from '@angular/router';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.page.html',
  styleUrls: ['./appointments.page.scss'],
  imports: [
    IonicModule,
    NgForOf,
    NgIf,
    FullCalendarModule
  ],
  standalone: true
})
export class AppointmentsPage implements OnInit {
  pendingAppointments: Appointment[] = [];
  confirmedAppointments: Appointment[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  showCalendar: boolean = false;
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin],
    initialView: 'timeGridWeek',
    events: [],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '17:00:00',
    height: 'auto'
  };

  constructor(
    private appointmentService: AppointmentService,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAppointments();
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

  loadAppointments() {
    this.isLoading = true;
    this.errorMessage = '';

    this.appointmentService.getDoctorAppointments('pending').subscribe({
      next: (appointments) => {
        this.pendingAppointments = appointments;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message;
        this.presentToast('Failed to load pending appointments.', 'danger');
      }
    });

    this.appointmentService.getDoctorAppointments('confirmed').subscribe({
      next: (appointments) => {
        this.confirmedAppointments = appointments;
        this.calendarOptions.events = appointments.map(appt => ({
          title: `Patient ID: ${appt.patientId}`,
          start: appt.date,
          duration: appt.duration
        }));
      },
      error: (err) => {
        this.presentToast('Failed to load confirmed appointments.', 'danger');
      }
    });
  }

  acceptAppointment(appointmentId: string) {
    this.appointmentService.updateAppointmentStatus(appointmentId, 'confirmed').subscribe({
      next: () => {
        this.presentToast('Appointment confirmed.');
        this.loadAppointments();
      },
      error: (err) => {
        this.presentToast('Failed to confirm appointment.', 'danger');
      }
    });
  }

  rejectAppointment(appointmentId: string) {
    this.appointmentService.updateAppointmentStatus(appointmentId, 'rejected').subscribe({
      next: () => {
        this.presentToast('Appointment rejected.');
        this.loadAppointments();
      },
      error: (err) => {
        this.presentToast('Failed to reject appointment.', 'danger');
      }
    });
  }

  manageConsultation(appointmentId: string, event: Event) {
    // Blur the button to prevent focus retention during navigation
    const target = event.target as HTMLElement;
    if (target instanceof HTMLButtonElement) {
      target.blur();
    }
    this.router.navigate([`/doctor/appointment-follow-up/${appointmentId}`]);
  }

  toggleView() {
    this.showCalendar = !this.showCalendar;
  }
}
