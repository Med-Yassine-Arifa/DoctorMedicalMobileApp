import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  {
    path: 'tabs',
    loadComponent: () => import('./patient/tabs/tabs.page').then( m => m.TabsPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./doctor/tabs/tabs.page').then( m => m.TabsPage)
  },
  {
    path: 'patient/patient-dashboard',
    loadComponent: () => import('./patient/patient-dashboard/patient-dashboard.page').then( m => m.PatientDashboardPage)
  },
  {
    path: 'patient/appointment-book',
    loadComponent: () => import('./patient/appointment-book/appointment-book.page').then( m => m.AppointmentBookPage)
  },
  {
    path: 'patient/appointments',
    loadComponent: () => import('./patient/appointments/appointments.page').then( m => m.AppointmentsPage)
  },
  {
    path: 'patient/documents',
    loadComponent: () => import('./patient/documents/documents.page').then( m => m.DocumentsPage)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./patient/notifications/notifications.page').then( m => m.NotificationsPage)
  },
  {
    path: 'consultation',
    loadComponent: () => import('./patient/consultation/consultation.page').then( m => m.ConsultationPage)
  },
  {
    path: 'appointments',
    loadComponent: () => import('./doctor/appointments/appointments.page').then( m => m.AppointmentsPage)
  },
  {
    path: 'consultation',
    loadComponent: () => import('./doctor/consultation/consultation.page').then( m => m.ConsultationPage)
  },
  {
    path: 'documents',
    loadComponent: () => import('./doctor/documents/documents.page').then( m => m.DocumentsPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./doctor/profile/profile.page').then( m => m.ProfilePage)
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


];
