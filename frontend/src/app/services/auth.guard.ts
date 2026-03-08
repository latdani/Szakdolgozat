import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service'; // Fontos az import!

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // A te szolgáltatásod isLoggedIn metódusát használjuk
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      // Ha nincs belépve, átirányítjuk a loginra a hibaüzenet paraméterrel
      this.router.navigate(['/login'], { queryParams: { auth: 'required' } });
      return false;
    }
  }
}
