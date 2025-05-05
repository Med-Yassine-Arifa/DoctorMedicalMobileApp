import { Routes } from '@angular/router';
import {TabsPage} from "./patient/tabs/tabs.page";


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'auth/signup',
    loadComponent: () => import('./auth/signup/signup.page').then( m => m.SignupPage)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  {
    path: 'auth/verify-otp',
    loadComponent: () => import('./auth/verify-otp/verify-otp.page').then( m => m.VerifyOtpPage)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.page').then( m => m.ResetPasswordPage)
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./admin/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'admin/doctors/create',
    loadComponent: () => import('./admin/doctors/doctor-form/doctor-form.page').then( m => m.DoctorFormPage)
  },
  {
    path: 'admin/doctors',
    loadComponent: () => import('./admin/doctors/doctors-list/doctors-list.page').then( m => m.DoctorsListPage)
  },


  {
    path: 'patient',
    component: TabsPage,
    children: [
      {
        path: '',
        redirectTo: 'patient-dashboard',
        pathMatch: 'full'
      },
      {
        path: 'patient-dashboard',
        loadComponent: () => import('./patient/patient-dashboard/patient-dashboard.page').then(m => m.PatientDashboardPage)
      },
      {
        path: 'all-doctors',
        loadComponent: () => import('./patient/all-doctors/all-doctors.page').then(m => m.AllDoctorsPage)
      },
      {
        path: 'doctor-details',
        loadComponent: () => import('./patient/doctor-details/doctor-details.page').then(m => m.DoctorDetailsPage)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./patient/notifications/notifications.page').then(m => m.NotificationsPage)
      },
      {
        path: 'medical history',
        loadComponent: () => import('./patient/medical-history/medical-history.page').then(m => m.MedicalHistoryPage)
      },
      {
        path: 'Upcoming appointments',
        loadComponent: () => import('./patient/upcoming-appointements/upcoming-appointements.page').then( m => m.UpcomingAppointementsPage)
      },
      {
        path: 'appointment-details',
        loadComponent: () => import('./patient/appointment-details/appointment-details.page').then( m => m.AppointmentDetailsPage)
      },
    ]
  },

  {
    path: 'doctor/documents',
    loadComponent: () => import('./doctor/documents/documents.page').then( m => m.DocumentsPage)
  },
  {
    path: 'doctor/profile',
    loadComponent: () => import('./doctor/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./doctor/tabs/tabs.page').then( m => m.TabsPage)
  },


  {
    path: 'appointment-follow-up',
    loadComponent: () => import('./doctor/appointment-follow-up/appointment-follow-up.page').then( m => m.AppointmentFollowUpPage)
  },
  {
    path: 'consultation-form',
    loadComponent: () => import('./doctor/consultation-form/consultation-form.page').then( m => m.ConsultationFormPage)
  },

  {
    path: 'doctor/appointments',
    loadComponent: () => import('./doctor/appointments/appointments.page').then(m => m.AppointmentsPage)
  },
  {
    path: 'doctor/appointment-follow-up/:id',
    loadComponent: () => import('./doctor/appointment-follow-up/appointment-follow-up.page').then(m => m.AppointmentFollowUpPage)
  },
  {
    path: 'doctor/consultation-form/:id',
    loadComponent: () => import('./doctor/consultation-form/consultation-form.page').then(m => m.ConsultationFormPage)
  },








];
