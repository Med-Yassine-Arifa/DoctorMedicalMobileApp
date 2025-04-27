import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerUtil {
  constructor(private toastController: ToastController) {}

  // Handle and display error messages
  async handleError(error: any, defaultMessage: string = 'An error occurred'): Promise<void> {
    console.error('Error:', error);

    let errorMessage = defaultMessage;

    if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    const toast = await this.toastController.create({
      message: errorMessage,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });

    await toast.present();
  }

  // Show success message
  async showSuccess(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });

    await toast.present();
  }
}
