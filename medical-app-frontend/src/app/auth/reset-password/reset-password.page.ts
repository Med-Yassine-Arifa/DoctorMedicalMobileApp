import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {IonicModule, ModalController} from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline ,  lockClosedOutline , arrowBackOutline } from 'ionicons/icons';
import {
  CongratulationModalComponent
} from "../../shared/components/congratulation-modal/congratulation-modal.component";

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule  ]
})

export class ResetPasswordPage implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  email: string = '';
  showPassword = false;
  showConfirmPassword = false;
  passwordMismatch = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private modalController: ModalController
  ){
    this.resetPasswordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required ,]
    });

    addIcons({
      eyeOutline,
      eyeOffOutline,
      lockClosedOutline,
      arrowBackOutline
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.errorMessage = 'Email not provided. Please go back and try again.';
        this.router.navigate(['/auth/forgot-password']);
      }
    });
    this.resetPasswordForm.valueChanges.subscribe(() => {
      this.checkPasswordMatch();
      if (this.errorMessage) {
        this.errorMessage = '';
      }
    });
  }
  checkPasswordMatch() {
    const password = this.resetPasswordForm.get('newPassword')?.value;
    const confirmPassword = this.resetPasswordForm.get('confirmPassword')?.value;

    // Only show mismatch error if both fields have values and they don't match
    if (password && confirmPassword && password !== confirmPassword) {
      this.passwordMismatch = true;
      // Set validation error on confirmPassword control
      this.resetPasswordForm.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      this.passwordMismatch = false;
      // If there's a mismatch error but passwords now match, clear the error
      if (this.resetPasswordForm.get('confirmPassword')?.hasError('mismatch')) {
        // Get current errors
        const errors = { ...this.resetPasswordForm.get('confirmPassword')?.errors };
        // Remove mismatch error
        delete errors['mismatch'];
        // Set remaining errors or null if no errors left
        this.resetPasswordForm.get('confirmPassword')?.setErrors(
          Object.keys(errors).length ? errors : null
        );
      }
    }
  }

  togglePasswordVisibility(field: 'newPassword' | 'confirmPassword') {
    if (field === 'newPassword') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) {
      if (this.resetPasswordForm.get('confirmPassword')?.hasError('mismatch')) {
        this.errorMessage = 'Passwords do not match.';
        return;
      } else if (this.resetPasswordForm.get('newPassword')?.invalid) {
        this.errorMessage = 'Please enter a valid password (minimum 6 characters).';
        return;
      } else {
        this.errorMessage = 'Please fill all required fields.';
        return;
      }
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const newPassword = this.resetPasswordForm.value.newPassword;

    this.authService.resetPassword(this.email, newPassword).subscribe({
      next: async () => {
        this.isLoading = false;

        // Show congratulation modal
        const modal = await this.modalController.create({
          component: CongratulationModalComponent,
          cssClass: 'congratulation-modal',
          componentProps: {
            title: 'Congratulations 🎉',
            message: 'Your password has been reset successfully',
            buttonText: 'Back to Login',
            redirectUrl: '/auth/login'
          },
          backdropDismiss: false
        });

        await modal.present();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to reset password. Please try again.';
        console.error('Password reset error:', error);
      }
    });
  }


  goBack() {
    this.router.navigate(['/auth/verify-otp'], { queryParams: { email: this.email } });
  }
}
