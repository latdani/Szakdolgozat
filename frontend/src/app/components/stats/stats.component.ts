import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { WorkoutService } from '../../services/workout.service';
import { MealService } from '../../services/meal.service';

Chart.register(...registerables);

// Diagram színek (a LiftLog színeinek sötétebb, fehér háttéren is jól olvasható változatai)
const COLOR_WORKOUTS = '#00879b';
const COLOR_VOLUME = '#2f6fd0';
const COLOR_CALORIES = '#1e8449';
const COLOR_GOAL = '#95a5a6';
const COLOR_GRID = '#eeeeee';
const COLOR_TEXT = '#7f8c8d';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, OnDestroy {
  @ViewChild('weeklyCanvas', { static: true }) weeklyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('volumeCanvas', { static: true }) volumeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('caloriesCanvas', { static: true }) caloriesCanvas!: ElementRef<HTMLCanvasElement>;

  dailyGoal = 2500; // Egyelőre fix, mint az étkezésnaplóban (később a profilból jön)
  loading = true;
  hasWorkouts = false;
  hasMeals = false;

  private charts: Chart[] = [];

  constructor(
    private workoutService: WorkoutService,
    private mealService: MealService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // A két lekérés párhuzamosan fut, a diagramok akkor készülnek el, ha mindkettő megjött
    forkJoin({
      workouts: this.workoutService.getUserWorkouts(),
      meals: this.mealService.getMeals()
    }).subscribe({
      next: ({ workouts, meals }) => {
        this.loading = false;
        this.hasWorkouts = workouts.length > 0;
        this.hasMeals = meals.length > 0;
        // Előbb megjelenítjük a diagramok dobozait, hogy a Chart.js a valós méretükkel rajzoljon
        this.cdr.detectChanges();
        this.buildWeeklyWorkoutsChart(workouts);
        this.buildVolumeChart(workouts);
        this.buildCaloriesChart(meals);
      },
      error: (err) => {
        this.loading = false;
        console.error('Hiba a statisztikák lekérésekor:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.charts.forEach(chart => chart.destroy());
  }

  // 1. Heti edzésszám az utolsó 8 hétben (a hét hétfőn kezdődik)
  private buildWeeklyWorkoutsChart(workouts: any[]) {
    const thisMonday = this.startOfWeek(new Date());
    const weeks: Date[] = [];
    for (let i = 7; i >= 0; i--) {
      const monday = new Date(thisMonday);
      monday.setDate(thisMonday.getDate() - i * 7);
      weeks.push(monday);
    }

    const counts = weeks.map(monday => {
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      return workouts.filter(w => {
        const date = new Date(w.date);
        return date >= monday && date < nextMonday;
      }).length;
    });

    this.charts.push(new Chart(this.weeklyCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: weeks.map(monday => this.formatDay(monday)),
        datasets: [{
          label: 'Edzések',
          data: counts,
          backgroundColor: COLOR_WORKOUTS,
          borderRadius: 4,
          maxBarThickness: 32
        }]
      },
      options: this.baseOptions('db', 'Hét kezdete', { stepSize: 1 })
    }));
  }

  // 2. Edzésvolumen edzésenként (súly × szett × ismétlés összege), az utolsó 20 edzés időrendben
  private buildVolumeChart(workouts: any[]) {
    const lastWorkouts = [...workouts]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-20);

    const volumes = lastWorkouts.map(w =>
      w.exercises.reduce((sum: number, ex: any) => sum + ex.weight * ex.sets * ex.reps, 0)
    );

    this.charts.push(new Chart(this.volumeCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: lastWorkouts.map(w => `${this.formatDay(new Date(w.date))} ${w.muscleGroup}`),
        datasets: [{
          label: 'Volumen',
          data: volumes,
          borderColor: COLOR_VOLUME,
          backgroundColor: COLOR_VOLUME,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.25
        }]
      },
      options: this.baseOptions('kg', 'Edzés')
    }));
  }

  // 3. Napi bevitt kalória az utolsó 14 napban, a napi célhoz képest
  private buildCaloriesChart(meals: any[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      days.push(day);
    }

    const totals = days.map(day => meals
      .filter(meal => new Date(meal.date).toDateString() === day.toDateString())
      .reduce((sum, meal) => sum + (meal.totalCalories || 0), 0)
    );

    this.charts.push(new Chart(this.caloriesCanvas.nativeElement, {
      data: {
        labels: days.map(day => this.formatDay(day)),
        datasets: [
          {
            type: 'bar',
            label: 'Bevitt kalória',
            data: totals,
            backgroundColor: COLOR_CALORIES,
            borderRadius: 4,
            maxBarThickness: 32,
            order: 2
          },
          {
            // A napi cél szaggatott vízszintes vonalként
            type: 'line',
            label: 'Napi cél',
            data: days.map(() => this.dailyGoal),
            borderColor: COLOR_GOAL,
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 0,
            order: 1
          }
        ]
      },
      options: this.baseOptions('kcal', 'Nap')
    }));
  }

  // Közös beállítások: visszafogott rács, tooltip a teljes oszlopra/pontra, jelmagyarázat nélkül
  private baseOptions(unit: string, xTitle: string, yTicks: any = {}): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('hu-HU')} ${unit}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          title: { display: true, text: xTitle, color: COLOR_TEXT },
          ticks: { color: COLOR_TEXT, maxRotation: 0, autoSkip: true }
        },
        y: {
          beginAtZero: true,
          grid: { color: COLOR_GRID },
          border: { display: false },
          title: { display: true, text: unit, color: COLOR_TEXT },
          ticks: { color: COLOR_TEXT, ...yTicks }
        }
      }
    };
  }

  private startOfWeek(date: Date): Date {
    const monday = new Date(date);
    monday.setHours(0, 0, 0, 0);
    const dayIndex = (monday.getDay() + 6) % 7; // hétfő = 0, vasárnap = 6
    monday.setDate(monday.getDate() - dayIndex);
    return monday;
  }

  // pl. "10. 06."
  private formatDay(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}. ${day}.`;
  }
}
