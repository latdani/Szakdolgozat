import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { WorkoutLogComponent } from './components/workout-log/workout-log.component';

export const routes: Routes = [
  // Ha a felhasználó a localhost:4200-ra jön, vigyük a /home-ra
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Definiált útvonalak
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'workout-log', component: WorkoutLogComponent },

  // Ha elírja a címet, dobjuk vissza a home-ra
  { path: '**', redirectTo: 'home' }
];


