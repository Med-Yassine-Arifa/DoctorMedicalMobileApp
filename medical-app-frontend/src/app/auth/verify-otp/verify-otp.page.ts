import {AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChildren} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline , alertCircleOutline} from "ionicons/icons";

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.page.html',
  styleUrls: ['./verify-otp.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class VerifyOtpPage implements OnInit , AfterViewInit {
  verifyOtpForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  email: string = '';
  otpControls = [0, 1, 2, 3, 4];

  @ViewChildren('otpInput') otpInputs !: QueryList<ElementRef> ;
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Create form with 5 separate controls for each digit
    const formControls: { [key: string]: FormControl } = {};
    this.otpControls.forEach((_, index) => {
      formControls[`digit${index}`] = new FormControl('', [Validators.required, Validators.pattern('[0-9]')]);
    });
    this.verifyOtpForm = this.formBuilder.group(formControls);
    addIcons({
      arrowBackOutline,
      alertCircleOutline
    })
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.errorMessage = 'Email not provided. Please go back and try again.';
        this.router.navigate(['/auth/forgot-password']);
      }
    });
  }
  ngAfterViewInit() {
    // Focus on the first input after view is initialized
    setTimeout(() => {
      this.otpInputs.first.nativeElement.focus();
    }, 100);
  }

  onOtpChange(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    // If a digit is entered, move to the next input
    if (value.length === 1 && index < this.otpControls.length - 1) {
      const inputs = this.otpInputs.toArray();
      inputs[index + 1].nativeElement.focus();
    }

    // If backspace is pressed and input is empty, move to previous input
    if (event.key === 'Backspace' && !value && index > 0) {
      const inputs = this.otpInputs.toArray();
      inputs[index - 1].nativeElement.focus();
    }

    this.checkFormValidity();
  }

  // Handle paste event for OTP
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    const pastedText = clipboardData.getData('text');

    // If pasted text is a number and has the correct length
    if (/^\d+$/.test(pastedText) && pastedText.length === this.otpControls.length) {
      this.otpControls.forEach((_, index) => {
        const control = this.verifyOtpForm.get(`digit${index}`);
        if (control) {
          control.setValue(pastedText[index]);
        }
      });

      const inputs = this.otpInputs.toArray();
      const lastInput = inputs[this.otpControls.length - 1];
      if (lastInput) {
        lastInput.nativeElement.focus();
      }

      this.checkFormValidity();
    }
  }


  checkFormValidity() {
    if (this.verifyOtpForm.valid) {
      setTimeout(() => {
        this.onSubmit();
      }, 500);
    }
  }

  // Get the complete OTP by combining all digits
  getOtp(): string {
    return this.otpControls
      .map((_, index) => {
        const control = this.verifyOtpForm.get(`digit${index}`);
        return control ? control.value : '';
      })
      .join('');
  }

  onSubmit() {
    if (this.verifyOtpForm.invalid) {
      this.errorMessage = 'Please enter a valid 5-digit OTP.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const otp = this.getOtp();
    console.log(`Submitting OTP verification: email=${this.email}, otp=${otp}`);

    this.authService.verifyOtp(this.email, otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'OTP verified successfully.';
        setTimeout(() => {
          this.router.navigate(['/auth/reset-password'], { queryParams: { email: this.email } });
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to verify OTP. Please try again.';
        console.error('OTP verification error:', error);
      }
    });
  }

  goBack() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
