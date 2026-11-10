import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Ez kell az *ngIf-hez
import { RouterModule, Router } from '@angular/router'; // Ez kell a routerLink-hez
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service'; // Beimportáljuk a szervizt
import { WorkoutService } from '../../services/workout.service';
import { MealService } from '../../services/meal.service';
import { ProfileService } from '../../services/profile.service';
import { WeightEntry, WeightService } from '../../services/weight.service';
import { FooterComponent } from '../../footer/footer.component';

// A kezdőlapon belépve megjelenő saját összesítő adatai
export interface HomeSummary {
  workoutsThisWeek: number;
  totalWorkouts: number;
  caloriesToday: number;
  dailyCalorieGoal: number;
  currentWeight: number;
  weightChange30: number | null; // változás az utolsó 30 napban (kg), ha van mihez viszonyítani
  lastWorkout: { date: string; muscleGroup: string } | null;
}

@Component({
  selector: 'app-home',
  standalone: true,
  // Az imports tömbbe be kell tennünk a modulokat, hogy a HTML ismerje őket
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  summary: HomeSummary | null = null;

  // A konstruktorban injektáljuk az AuthService-t és a Router-t
  constructor(
    public authService: AuthService, // PUBLIC legyen, különben a HTML nem látja!
    private router: Router,
    private workoutService: WorkoutService,
    private mealService: MealService,
    private profileService: ProfileService,
    private weightService: WeightService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) return;

    forkJoin({
      workouts: this.workoutService.getUserWorkouts(),
      meals: this.mealService.getMeals(),
      profile: this.profileService.getProfile(),
      weights: this.weightService.getWeights()
    }).subscribe({
      next: ({ workouts, meals, profile, weights }) => {
        this.summary = buildSummary(workouts, meals, profile, weights, new Date());
      },
      error: (err) => console.error('Hiba az összesítő lekérésekor:', err)
    });
  }

  // Ez a függvény hiányzott a hibaüzenet szerint
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

// Az összesítő kiszámítása (külön függvény, hogy egységtesztelni lehessen)
export function buildSummary(workouts: any[], meals: any[], profile: any, weights: WeightEntry[], now: Date): HomeSummary {
  // A hét hétfőn kezdődik
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);

  const caloriesToday = meals
    .filter(m => new Date(m.date).toDateString() === now.toDateString())
    .reduce((sum, m) => sum + (m.totalCalories || 0), 0);

  // A backend dátum szerint csökkenő sorrendben adja az edzéseket, így az első a legutolsó
  const last = workouts[0];

  // Testsúly-változás: a legutolsó bejegyzés a 30 nappal ezelőtti vagy későbbi legrégebbihez képest
  let weightChange30: number | null = null;
  if (weights.length >= 2) {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    const fromDay = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
    const recent = weights.filter(w => w.day >= fromDay);
    if (recent.length >= 2) {
      weightChange30 = Math.round((recent[recent.length - 1].weight - recent[0].weight) * 10) / 10;
    }
  }

  return {
    workoutsThisWeek: workouts.filter(w => new Date(w.date) >= monday).length,
    totalWorkouts: workouts.length,
    caloriesToday,
    dailyCalorieGoal: profile.dailyCalorieGoal,
    currentWeight: profile.currentWeight,
    weightChange30,
    lastWorkout: last ? { date: last.date, muscleGroup: last.muscleGroup } : null
  };
}
