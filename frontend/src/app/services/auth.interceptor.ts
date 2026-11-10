import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Minden backend kéréshez hozzáteszi a bejelentkezési tokent.
// Ha a szerver 401-et ad (lejárt/érvénytelen token), kiléptet és a login oldalra küld.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      // A login/register hibás jelszóra is 401-et ad, azt a saját oldaluk kezeli
      if (err.status === 401 && token) {
        authService.logout();
        router.navigate(['/login'], { queryParams: { auth: 'required' } });
      }
      return throwError(() => err);
    })
  );
};
