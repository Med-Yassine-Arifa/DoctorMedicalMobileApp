import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {BehaviorSubject, Observable, throwError, from, Subject} from 'rxjs';
import {catchError, debounceTime, map, switchMap, tap} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User, PatientUser, AdminUser, DoctorUser } from '../models/user.model';
import { StorageUtil } from '../utils/storage.util';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  Auth,
  signOut,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  private auth: Auth;
  private cachedToken: { token: string; expiry: number } | null = null;
  private tokenFetchTrigger = new Subject<void>();

  constructor(
    private router : Router,
    private storageUtil: StorageUtil,
    private http: HttpClient
  ) {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);
    this.initializeAuthState();
    this.setupTokenFetchDebounce();
  }

  private setupTokenFetchDebounce() {
    this.tokenFetchTrigger.pipe(
      debounceTime(100) // Prevent rapid token fetches
    ).subscribe(() => {
      console.log('Debounced token fetch triggered');
    });
  }

  private initializeAuthState() {
    console.log('Initializing auth state');
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult(false);
          console.log('Auth state: User found, token checked');
          const iat =  idTokenResult.claims.iat === 'number' ? new Date(Number(idTokenResult.claims.iat) * 1000).toISOString() : 'Unknown';
          const exp =  idTokenResult.claims.exp === 'number' ? new Date(Number(idTokenResult.claims.exp) * 1000).toISOString() : 'Unknown';
          console.log('Token Timestamps:', {
            iat,
            exp,
            clientTime: new Date().toISOString(),
            claims: JSON.stringify(idTokenResult.claims)
          });
          if ( idTokenResult.claims.exp === 'number') {
            this.cachedToken = {
              token: idTokenResult.token,
              expiry: Number(idTokenResult.claims.exp) * 1000
            };
          } else {
            console.warn('Token expiry not found or invalid in initializeAuthState, skipping cache');
            this.cachedToken = null;
          }
          const role = idTokenResult.claims['role'] as 'patient' | 'doctor' | 'admin';
          if (!role) {
            console.error('Role not found in token');
            this.userSubject.next(null);
            await this.storageUtil.remove('user');
            return;
          }
          let appUser: User;
          if (role === 'patient') {
            appUser = {
              firebaseUid: user.uid,
              email: user.email || '',
              role: 'patient',
              profile: { firstName: '', lastName: '', phone: '', address: '' }
            } as PatientUser;
          } else if (role === 'doctor') {
            appUser = {
              firebaseUid: user.uid,
              email: user.email || '',
              role: 'doctor',
              profile: { firstName: '', lastName: '', phone: '', address: '', specialization: '', licenseNumber: '' },
              availability: []
            } as DoctorUser;
          } else {
            appUser = {
              firebaseUid: user.uid,
              email: user.email || '',
              role: 'admin'
            } as AdminUser;
          }
          this.userSubject.next(appUser);
          await this.storageUtil.set('user', appUser);
          console.log('User set in BehaviorSubject:', appUser.firebaseUid);
        } catch (error) {
          console.error('Error checking token during auth state init:', error);
          this.userSubject.next(null);
          await this.storageUtil.remove('user');
          this.cachedToken = null;
        }
      } else {
        console.log('Auth state: No user');
        this.userSubject.next(null);
        await this.storageUtil.remove('user');
        this.cachedToken = null;
      }
    }, (error) => {
      console.error('Auth state error:', error);
      this.userSubject.next(null);
      this.storageUtil.remove('user');
      this.cachedToken = null;
    });
  }

  login(email: string, password: string): Observable<User> {
    console.log('Login attempt:', email);
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(userCredential => {
        return new Observable<User>(observer => {
          const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
            if (user && user.uid === userCredential.user.uid) {
              try {
                const idTokenResult = await user.getIdTokenResult(false);
                console.log('Login: Token checked');
                const iat =  idTokenResult.claims.iat === 'number' ? new Date(Number(idTokenResult.claims.iat) * 1000).toISOString() : 'Unknown';
                const exp =  idTokenResult.claims.exp === 'number' ? new Date(Number(idTokenResult.claims.exp) * 1000).toISOString() : 'Unknown';
                console.log('Token Timestamps:', {
                  iat,
                  exp,
                  clientTime: new Date().toISOString(),
                  claims: JSON.stringify(idTokenResult.claims)
                });
                if ( idTokenResult.claims.exp === 'number') {
                  this.cachedToken = {
                    token: idTokenResult.token,
                    expiry: Number(idTokenResult.claims.exp) * 1000
                  };
                } else {
                  console.warn('Token expiry not found or invalid in login, skipping cache');
                  this.cachedToken = null;
                }
                const role = idTokenResult.claims['role'] as 'patient' | 'doctor' | 'admin';
                if (!role) {
                  unsubscribe();
                  observer.error(new Error('Role not found in token'));
                  return;
                }
                let appUser: User;
                if (role === 'patient') {
                  appUser = {
                    firebaseUid: user.uid,
                    email: email,
                    role: 'patient',
                    profile: {firstName: '', lastName: '', phone: '', address: ''}
                  } as PatientUser;
                } else if (role === 'doctor') {
                  appUser = {
                    firebaseUid: user.uid,
                    email: email,
                    role: 'doctor',
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
                  appUser = {
                    firebaseUid: user.uid,
                    email: email,
                    role: 'admin'
                  } as AdminUser;
                }
                this.userSubject.next(appUser);
                await this.storageUtil.set('user', appUser);
                console.log('Login: User set:', appUser.firebaseUid);
                unsubscribe();
                observer.next(appUser);
                observer.complete();
              } catch (error) {
                console.error('Error checking token post-login:', error);
                unsubscribe();
                observer.error(error);
              }
            }
          }, (error) => {
            console.error('Auth state error during login:', error);
            unsubscribe();
            observer.error(error);
          });
        });
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
    console.log('Registering patient:', userData.email);
    const payload = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || '',
      address: userData.address || ''
    };

    return this.http.post<{ message: string; role: string; userId: string }>(`${environment.apiUrl}/auth/register`, payload).pipe(
      switchMap(() => {
        console.log('Registration successful, logging in');
        return this.login(userData.email, userData.password);
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
    console.log('Initiating Google sign-in');
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(userCredential => {
        return from(userCredential.user.getIdTokenResult(false)).pipe(
          switchMap(idTokenResult => {
            console.log('Google sign-in: Token checked');
            const iat =  idTokenResult.claims.iat === 'number' ? new Date(Number(idTokenResult.claims.iat) * 1000).toISOString() : 'Unknown';
            const exp =  idTokenResult.claims.exp === 'number' ? new Date(Number(idTokenResult.claims.exp) * 1000).toISOString() : 'Unknown';
            console.log('Token Timestamps:', {
              iat,
              exp,
              clientTime: new Date().toISOString()
            });
            if (idTokenResult.claims.exp === 'number') {
              this.cachedToken = {
                token: idTokenResult.token,
                expiry: Number(idTokenResult.claims.exp) * 1000
              };
            } else {
              console.warn('Token expiry not found or invalid, skipping cache');
              this.cachedToken = null;
            }
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
                console.log('Google sign-in: User set:', user.firebaseUid);
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
    console.log('Sending password reset for:', email);
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
    console.log('Verifying OTP for:', email);
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
    console.log('Resetting password for:', email);
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
    console.log('Signing out');
    return new Observable<void>(observer => {
      const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
        if (!user) {
          console.log('Sign-out: No user, clearing state');
          this.userSubject.next(null);
          await this.storageUtil.remove('user');
          this.cachedToken = null;
          this.router.navigateByUrl('/auth/login', { replaceUrl: true });
          unsubscribe();
          observer.next();
          observer.complete();
        } else {
          try {
            await signOut(this.auth);
            console.log('Sign-out successful');
          } catch (error) {
            console.error('Sign-out error:', error);
            unsubscribe();
            observer.error(new Error('Failed to sign out. Please try again.'));
          }
        }
      }, (error) => {
        console.error('Auth state error during sign-out:', error);
        unsubscribe();
        observer.error(error);
      });
    });
  }

  getCurrentUser(): User | null {
    const user = this.userSubject.value;
    console.log('Getting current user:', user ? user.firebaseUid : 'No user');
    return user;
  }

  isAdmin(): Observable<boolean> {
    return this.user$.pipe(
      map(user => {
        const isAdmin = user?.role === 'admin';
        console.log('Checking isAdmin:', isAdmin);
        return isAdmin;
      })
    );
  }
  async getAuthTokenWithRetry(user: any, attempts: number = 2): Promise<{ token: string; expiry: number | null }> {
    for (let i = 0; i < attempts; i++) {
      try {
        const token = await user.getIdToken(i > 0); // Force refresh on retries
        const idTokenResult = await user.getIdTokenResult(i > 0);
        console.log('Token fetch attempt:', i + 1, 'Claims:', JSON.stringify(idTokenResult.claims));
        if (typeof idTokenResult.claims.exp === 'number') {
          return {
            token,
            expiry: Number(idTokenResult.claims.exp) * 1000
          };
        } else {
          console.warn(`Attempt ${i + 1}: Token expiry not found or invalid, exp:`, idTokenResult.claims.exp);
        }
      } catch (error) {
        console.error(`Attempt ${i + 1}: Error fetching token:`, error);
      }
    }
    // Fallback: Return token without expiry if all attempts fail
    console.warn('All attempts failed, returning token without expiry');
    const token = await user.getIdToken(true);
    return { token, expiry: null };
  }

  getAuthToken(): Observable<string | null> {
    console.log('Fetching auth token');
    this.tokenFetchTrigger.next();
    return new Observable<string | null>(observer => {
      const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          try {
            const now = Date.now();
            if (this.cachedToken && this.cachedToken.expiry && this.cachedToken.expiry > now + 5 * 60 * 1000) {
              console.log('Using cached token');
              observer.next(this.cachedToken.token);
              observer.complete();
            } else {
              const { token, expiry } = await this.getAuthTokenWithRetry(user);
              if (expiry) {
                this.cachedToken = { token, expiry };
                console.log('Token fetched and cached');
              } else {
                this.cachedToken = null;
                console.warn('Token fetched but not cached due to invalid expiry');
              }
              console.log('Token Timestamps:', {
                iat: 'Unavailable', // iat not available without idTokenResult
                exp: expiry ? new Date(expiry).toISOString() : 'Unknown',
                clientTime: new Date().toISOString()
              });
              observer.next(token);
              observer.complete();
            }
          } catch (error) {
            console.error('Error getting ID token:', error);
            this.cachedToken = null;
            observer.next(null);
            observer.complete();
          }
        } else {
          console.warn('No user logged in');
          this.cachedToken = null;
          observer.next(null);
          observer.complete();
        }
        unsubscribe();
      }, (error) => {
        console.error('Auth state error during token fetch:', error);
        this.cachedToken = null;
        observer.error(error);
      });
    });
  }
}
