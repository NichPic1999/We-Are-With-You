import { AuthService } from './../modules/shared/services/authentication/auth.service';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'];
  const role = localStorage.getItem('USER_ROLE');

  try {
    const response = await lastValueFrom(authService.isLoggedIn());

    if (!response) {
      router.navigate(['/login']);
      return false;
    } else {
      if (role === requiredRole) {
        return true;
      }
        return false;
    }
  } catch (err) {
    router.navigate(['/login']);
    return false;
  }
};
