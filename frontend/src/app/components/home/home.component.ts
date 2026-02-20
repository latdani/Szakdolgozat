import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Ez kell az *ngIf-hez
import { RouterModule, Router } from '@angular/router'; // Ez kell a routerLink-hez
import { AuthService } from '../../services/auth.service'; // Beimportáljuk a szervizt

@Component({
  selector: 'app-home',
  standalone: true,
  // Az imports tömbbe be kell tennünk a modulokat, hogy a HTML ismerje őket
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  // A konstruktorban injektáljuk az AuthService-t és a Router-t
  constructor(
    public authService: AuthService, // PUBLIC legyen, különben a HTML nem látja!
    private router: Router
  ) {}

  // Ez a függvény hiányzott a hibaüzenet szerint
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
