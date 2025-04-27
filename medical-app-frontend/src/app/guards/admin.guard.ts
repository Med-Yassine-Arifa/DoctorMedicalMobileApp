import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.user$.pipe(
      take(1),
      map(user => {
        // Check if user exists and has admin role
        const isAdmin = user && user.role === 'admin';

        if (!isAdmin) {
          console.log('Access denied: User is not an admin');
          this.router.navigate(['/auth/login']);
          return false;
        }

        return true;
      })
    );
  }
}
