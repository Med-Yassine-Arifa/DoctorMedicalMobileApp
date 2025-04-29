import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Intercepting request:', req.url);
  if (!req.url.startsWith('http://localhost:5000/api')) {
    return next(req);
  }

  return from(authService.getAuthToken()).pipe(
    switchMap(token => {
      if (token) {
        console.log('Adding token to request');
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }
      console.log('No token available, proceeding without Authorization header');
      return next(req);
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        console.log('401 Unauthorized, attempting token refresh');
        isRefreshing = true;
        return from(authService.getAuthToken()).pipe(
          switchMap(newToken => {
            isRefreshing = false;
            if (newToken) {
              console.log('Retrying with new token');
              const authReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(authReq);
            }
            console.error('No new token available, redirecting to login');
            router.navigateByUrl('/auth/login', { replaceUrl: true });
            return throwError(() => new Error('Authentication failed'));
          }),
          catchError(err => {
            isRefreshing = false;
            console.error('Token refresh failed:', err);
            router.navigateByUrl('/auth/login', { replaceUrl: true });
            return throwError(() => new Error('Authentication failed'));
          })
        );
      }
      console.error('HTTP error:', error);
      return throwError(() => error);
    }),
    tap(() => {
      if (isRefreshing) {
        isRefreshing = false;
      }
    })
  );
}
