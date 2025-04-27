import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class SignupPage {
  signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      address: ['']
    });
    this.signupForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
      }
    });
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      if (this.signupForm.get('firstName')?.invalid) {
        this.errorMessage = 'Please enter your first name';
        return;
      }
      if (this.signupForm.get('lastName')?.invalid) {
        this.errorMessage = 'Please enter your last name';
        return;
      }
      if (this.signupForm.get('email')?.invalid) {
        this.errorMessage = 'Please enter a valid email address';
        return;
      }
      if (this.signupForm.get('password')?.invalid) {
        this.errorMessage = 'Password must be at least 6 characters';
        return;
      }
      this.errorMessage = 'Please fill out all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const userData = this.signupForm.value;

    this.authService.registerPatient(userData).subscribe({
      next: (user) => {
        this.isLoading = false;
        // Since registerPatient only creates patients, redirect to patient dashboard
        this.router.navigate(['/patient/patient-dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        // Provide more specific error messages based on common registration errors
        if (error.code === 'auth/email-already-in-use') {
          this.errorMessage = 'This email is already registered. Please use a different email or try logging in';
        } else if (error.code === 'auth/invalid-email') {
          this.errorMessage = 'The email address is not valid';
        }
        else {
          this.errorMessage =  'Registration failed. Please try again';
        }
        console.error('Registration error details:', error);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
