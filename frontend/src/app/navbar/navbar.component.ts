// navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  userName: string = '';

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Frissítjük a nevet, ha van elmentett user
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.name;
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
