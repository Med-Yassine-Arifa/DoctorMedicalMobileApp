import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline , mailOutline , lockClosedOutline ,alertCircleOutline ,logoGoogle} from 'ionicons/icons';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class LoginPage {
  loginForm: FormGroup;
  isLoading = false;
  isGoogleLoading = false;
  errorMessage = '';
  returnUrl: string;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/auth/login';

    // Listen for form changes to clear error message when user starts typing
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
      }
    });

    addIcons({
      eyeOutline,
      eyeOffOutline,
      mailOutline,
      lockClosedOutline,
      alertCircleOutline,
      logoGoogle
    });
  }
  onSubmit() {
    if (this.loginForm.invalid) {
      if (this.loginForm.get('email')?.invalid) {
        this.errorMessage = 'Please enter a valid email address';
        return;
      }
      if (this.loginForm.get('password')?.invalid) {
        this.errorMessage = 'Password must be at least 6 characters';
        return;
      }
      this.errorMessage = 'Please enter a valid email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.isLoading = false;
        if (user.role === 'patient') {
          this.router.navigate(['/patient']);
        } else if (user.role === 'doctor') {
          this.router.navigate(['/doctor/appointments']);
        } else if (user.role === 'admin') {

          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        this.isLoading = false;
        // Provide more specific error messages based on common authentication errors
        if (error.code === 'auth/user-not-found') {
          this.errorMessage = 'No account found with this email address';
        } else if (error.code === 'auth/wrong-password') {
          this.errorMessage = 'Incorrect password. Please try again';
        } else if (error.code === 'auth/too-many-requests') {
          this.errorMessage = 'Too many failed login attempts. Please try again later';
        } else {
          this.errorMessage = error.message || 'Login failed. Please try again';
        }
        console.error('Login error details:', error);
      }
    });
  }

  signInWithGoogle() {
    this.isGoogleLoading = true;
    this.errorMessage = '';

    this.authService.signInWithGoogle().subscribe({
      next: (user) => {
        this.isGoogleLoading = false;
        if (user.role === 'patient') {
          this.router.navigate(['/patient/patient-dashboard']);
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        this.isGoogleLoading = false;
        // Provide more specific error messages for Google sign-in
        if (error.code === 'auth/popup-closed-by-user') {
          this.errorMessage = 'Sign-in cancelled. Please try again';
        } else if (error.code === 'auth/popup-blocked') {
          this.errorMessage = 'Pop-up blocked by browser. Please allow pop-ups and try again';
        } else {
          this.errorMessage = error.message || 'Google sign-in failed. Please try again';
        }
        console.error('Google sign-in error details:', error);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToSignup() {
    this.router.navigate(['/auth/signup']);
  }

  goToForgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
