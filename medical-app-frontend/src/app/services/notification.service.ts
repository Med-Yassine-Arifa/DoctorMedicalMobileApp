import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { ToastController } from '@ionic/angular';
import { AuthService } from './auth.service'; // Adjust path as needed
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toastController: ToastController
  ) {}

  async initPushNotifications(): Promise<void> {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') {
      console.error('Push notification permission not granted');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('FCM Token:', token.value);
      this.updateFcmToken(token.value).subscribe({
        next: () => console.log('FCM token updated successfully'),
        error: (err) => console.error('Failed to update FCM token:', err)
      });
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('FCM registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      await this.presentToast(notification.title || 'Notification', notification.body || 'New notification');
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action:', action);
      if (action.notification.data.appointmentId) {
        // Navigation requires Router injection; implement in component if needed
      }
    });
  }

  private updateFcmToken(token: string): Observable<any> {
    return this.authService.getAuthToken().pipe(
      switchMap(authToken => {
        if (!authToken) {
          return throwError(() => new Error('No authentication token available'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        });
        return this.http.post(
          `${this.apiUrl}/update-fcm-token`,
          { fcmToken: token },
          { headers }
        ).pipe(
          catchError(err => throwError(() => new Error(err.error?.error || 'Failed to update FCM token')))
        );
      })
    );
  }

  private async presentToast(header: string, message: string): Promise<void> {
    const toast = await this.toastController.create({
      header,
      message,
      duration: 3000,
      position: 'top',
      color: 'primary'
    });
    await toast.present();
  }
}
