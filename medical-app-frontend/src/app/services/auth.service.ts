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
  signInWithCustomToken,
  signInWithEmailAndPassword
} from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  private auth: Auth;

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
    if (storedUser) {
      this.userSubject.next(storedUser);
    }
  }

  login(email: string, password: string): Observable<User> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(userCredential => {
        return from(userCredential.user.getIdTokenResult(true)).pipe(
          tap(idTokenResult => {
            console.warn('ID Token:', idTokenResult.token);
            console.warn('User ID:', userCredential.user.uid);
            console.warn('Role:', idTokenResult.claims['role'] || 'Not found');
          }),
          map(idTokenResult => {
            const role = idTokenResult.claims['role'] as 'patient' | 'doctor' | 'admin';
            if (!role) {
              throw new Error('Role not found in token');
            }
            let user: User;
            if (role === 'patient') {
              user = {
                firebaseUid: userCredential.user.uid,
                email: email,
                role: 'patient',
                profile: { firstName: '', lastName: '', phone: '', address: '' }
              } as PatientUser;
            } else if (role === 'doctor') {
              user = {
                firebaseUid: userCredential.user.uid,
                email: email,
                role: 'doctor',
                profile: { firstName: '', lastName: '', phone: '', address: '', specialization: '', licenseNumber: '' },
                availability: []
              } as DoctorUser;
            } else {
              user = {
                firebaseUid: userCredential.user.uid,
                email: email,
                role: 'admin'
              } as AdminUser;
            }
            return user;
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
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = 'Invalid email or password.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Too many attempts. Please try again later.';
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
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || '',
      address: userData.address || ''
    };

    return this.http.post<{ message: string; role: string; userId: string }>(`${environment.apiUrl}/auth/register`, payload).pipe(
      switchMap(() => this.login(userData.email, userData.password)),
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
        return from(userCredential.user.getIdTokenResult(true)).pipe(
          switchMap(idTokenResult => {
            return this.http.post<{ message: string; role: string; userId: string }>(`${environment.apiUrl}/auth/google-login`, { idToken: idTokenResult.token }).pipe(
              map(response => {
                const user: PatientUser = {
                  firebaseUid: userCredential.user.uid,
                  email: userCredential.user.email || '',
                  role: 'patient',
                  profile: {
                    firstName: userCredential.user.displayName?.split(' ')[0] || '',
                    lastName: userCredential.user.displayName?.split(' ').slice(1).join(' ') || '',
                    phone: userCredential.user.phoneNumber || '',
                    address: ''
                  }
                };
                return user;
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
