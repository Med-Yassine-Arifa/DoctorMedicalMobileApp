import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline , mailOutline } from 'ionicons/icons';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class ForgotPasswordPage {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
    addIcons({
      arrowBackOutline,
      mailOutline
    })
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.forgotPasswordForm.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'OTP sent to your email. Please check your inbox.';
        setTimeout(() => {
          this.router.navigate(['/auth/verify-otp'], { queryParams: { email } });
        }, 500);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.code === 'auth/user-not-found') {
          this.errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
          this.errorMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/too-many-requests') {
          this.errorMessage = 'Too many requests. Please try again later.';
        } else {
          this.errorMessage = 'Failed to send OTP. Please try again.';
        }
      }
    });
  }


  goBack() {
    this.router.navigate(['/auth/login']);
  }
}
