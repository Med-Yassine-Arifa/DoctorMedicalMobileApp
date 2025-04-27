import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, from } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User, PatientUser, AdminUser , DoctorUser} from '../models/user.model';
import { StorageUtil } from '../utils/storage.util';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  Auth,
  signOut,
  signInWithCustomToken
} from 'firebase/auth';

interface LoginResponse {
  message: string;
  role: 'patient' | 'doctor' | 'admin';
  userId: string;
  token: string;  // Custom token for email/password login
}

interface RegisterResponse {
  message: string;
  role: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  private auth: Auth;
  private customToken: string | null = null;

  constructor(
    private router: Router,
    private storageUtil: StorageUtil,
    private http: HttpClient
  ) {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);
    this.initializeAuthState();
  }

  private async initializeAuthState() {
    const storedUser = await this.storageUtil.get<User>('user');
    const storedToken = await this.storageUtil.get<string>('customToken');
    if (storedUser) {
      this.userSubject.next(storedUser);
    }
    if (storedToken) {
      this.customToken = storedToken;
      // Sign in with the custom token to initialize Firebase Auth state
      from(signInWithCustomToken(this.auth, storedToken)).subscribe({
        error: (err) => console.error('Failed to sign in with stored custom token:', err)
      });
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      switchMap(response => {
        this.customToken = response.token;
        this.storageUtil.set('customToken', response.token);
        // Sign in with the custom token to initialize Firebase Auth state
        return from(signInWithCustomToken(this.auth, response.token)).pipe(
          map(() => {
            let userData: User;
            if (response.role === 'patient') {
              userData = {
                firebaseUid: response.userId,
                email: email,
                role: 'patient',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                profile: {
                  firstName: '',
                  lastName: '',
                  phone: '',
                  address: ''
                }
              } as PatientUser;
            } else if (response.role === 'doctor') {
              userData = {
                firebaseUid: response.userId,
                email: email,
                role: 'doctor',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                profile: {
                  firstName: '',
                  lastName: '',
                  phone: '',
                  address: '',
                  specialization: '',
                  licenseNumber: ''
                },
                availability: []
              } as DoctorUser;
            } else {
              userData = {
                firebaseUid: response.userId,
                email: email,
                role: 'admin',
              } as AdminUser;
            }
            return userData;
          }),
          tap(user => {
            this.userSubject.next(user);
            this.storageUtil.set('user', user);
          })
        );
      }),
      catchError(error => {
        console.error('Login error:', error);
        let errorMessage = 'Invalid email or password. Please try again.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  registerPatient(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
  }): Observable<User> {
    const payload = {
      email: userData.email,
      password: userData.password,
      role: 'patient',
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || '',
      address: userData.address || ''
    };

    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, payload).pipe(
      map(response => {
        const newUser: PatientUser = {
          firebaseUid: response.userId,
          email: userData.email,
          role: 'patient',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profile: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone || '',
            address: userData.address || ''
          }
        };
        return newUser;
      }),
      tap(user => {
        this.userSubject.next(user);
        this.storageUtil.set('user', user);
      }),
      catchError(error => {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed. Please try again.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  signInWithGoogle(): Observable<User> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(userCredential => {
        const userId = userCredential.user.uid;
        return from(userCredential.user.getIdToken(true)).pipe(
          switchMap(idToken => {
            return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/google-login`, { idToken }).pipe(
              map(response => {
                const userData: PatientUser = {
                  firebaseUid: userId,
                  email: userCredential.user.email || '',
                  role: 'patient',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  profile: {
                    firstName: userCredential.user.displayName?.split(' ')[0] || '',
                    lastName: userCredential.user.displayName?.split(' ').slice(1).join(' ') || '',
                    phone: userCredential.user.phoneNumber || '',
                    address: ''
                  }
                };
                return userData;
              }),
              tap(user => {
                this.userSubject.next(user);
                this.storageUtil.set('user', user);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Google sign-in error:', error);
        let errorMessage = 'Google sign-in failed. Please try again.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/forgot-password`, { email }).pipe(
      catchError(error => {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send password reset email. Please try again.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  verifyOtp(email: string, otp: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/verify-otp`, { email, otp }).pipe(
      catchError(error => {
        console.error('OTP verification error:', error);
        let errorMessage = 'Invalid or expired OTP. Please try again.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  resetPassword(email: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/reset-password`, { email, newPassword }).pipe(
      catchError(error => {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to reset password. Please try again.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  signOut(): Observable<void> {
    this.customToken = null;
    this.storageUtil.remove('customToken');
    return from(signOut(this.auth)).pipe(
      tap(() => {
        this.userSubject.next(null);
        this.storageUtil.remove('user');
        this.router.navigate(['/auth/login']);
      }),
      catchError(error => {
        console.error('Sign out error:', error);
        return throwError(() => new Error('Failed to sign out. Please try again.'));
      })
    );
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isAdmin(): Observable<boolean> {
    return this.user$.pipe(map((user) => user?.role === "admin"));
  }

  getAuthToken(): Observable<string | null> {
    const user = this.auth.currentUser;
    if (!user) {
      console.warn('No user logged in');
      return from(Promise.resolve(null));
    }
    return from(user.getIdToken(true).catch(err => {
      console.error('Error getting ID token:', err);
      return null;
    }));
  }
}
