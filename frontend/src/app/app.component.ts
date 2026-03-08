import { Component } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  showNavbar: boolean = true;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentUrl = event.urlAfterRedirects;

      if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
        this.showNavbar = false;
      } else {
        this.showNavbar = true;
      }
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
