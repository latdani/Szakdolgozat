import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { HomeComponent, buildSummary } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let http: HttpTestingController;

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  }

  afterEach(() => localStorage.clear());

  it('kijelentkezve nem kér adatot és nem mutat összesítőt (nincsenek kitalált számok)', async () => {
    localStorage.clear();
    await setup();
    http.expectNone('/api/workouts');
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('.stats')).toBeNull();
    expect(html.textContent).not.toContain('10K+');
  });

  it('belépve a saját adatokból mutatja az összesítőt', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Teszt' }));
    localStorage.setItem('token', 't');
    await setup();

    http.expectOne('/api/workouts').flush([]);
    http.expectOne('/api/meals').flush([]);
    http.expectOne('/api/profile').flush({ dailyCalorieGoal: 2200, currentWeight: 80 });
    http.expectOne('/api/weights').flush([]);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).querySelector('.stats')?.textContent || '';
    expect(text).toContain('Saját összesítőd');
    expect(text).toContain('80');
  });
});

describe('buildSummary (kezdőlap összesítő számítása)', () => {
  // 2026-11-12 csütörtök, így a hét 11-09 hétfőn kezdődik
  const now = new Date(2026, 10, 12, 15, 0);
  const profile = { dailyCalorieGoal: 2500, currentWeight: 81 };

  it('a heti edzésszámba csak a hétfő óta rögzített edzések számítanak', () => {
    const workouts = [
      { date: new Date(2026, 10, 11).toISOString(), muscleGroup: 'Láb' },
      { date: new Date(2026, 10, 9, 8).toISOString(), muscleGroup: 'Hát' },
      { date: new Date(2026, 10, 8, 20).toISOString(), muscleGroup: 'Mell' } // előző vasárnap
    ];
    const s = buildSummary(workouts, [], profile, [], now);
    expect(s.workoutsThisWeek).toBe(2);
    expect(s.totalWorkouts).toBe(3);
    expect(s.lastWorkout?.muscleGroup).toBe('Láb');
  });

  it('a mai kalória csak a mai étkezéseket adja össze', () => {
    const meals = [
      { date: new Date(2026, 10, 12, 8).toISOString(), totalCalories: 500 },
      { date: new Date(2026, 10, 12, 13).toISOString(), totalCalories: 700 },
      { date: new Date(2026, 10, 11, 19).toISOString(), totalCalories: 900 }
    ];
    expect(buildSummary([], meals, profile, [], now).caloriesToday).toBe(1200);
  });

  it('a 30 napos testsúly-változás a 30 napon belüli első és utolsó bejegyzésből jön', () => {
    const weights = [
      { _id: '1', day: '2026-09-01', weight: 90 }, // 30 napnál régebbi, nem számít
      { _id: '2', day: '2026-10-20', weight: 83.4 },
      { _id: '3', day: '2026-11-10', weight: 82.1 }
    ];
    expect(buildSummary([], [], profile, weights, now).weightChange30).toBe(-1.3);
  });

  it('üres adatoknál nincs utolsó edzés és nincs súlyváltozás', () => {
    const s = buildSummary([], [], profile, [], now);
    expect(s.lastWorkout).toBeNull();
    expect(s.weightChange30).toBeNull();
    expect(s.caloriesToday).toBe(0);
  });
});
