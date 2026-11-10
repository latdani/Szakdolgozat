import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WorkoutService } from './workout.service';

describe('WorkoutService', () => {
  let service: WorkoutService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(WorkoutService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lekéri a saját edzéseket (GET /api/workouts)', () => {
    let result: any[] = [];
    service.getUserWorkouts().subscribe(w => result = w);
    const req = http.expectOne('/api/workouts');
    expect(req.request.method).toBe('GET');
    req.flush([{ muscleGroup: 'Mell' }]);
    expect(result.length).toBe(1);
  });

  it('mentés, módosítás és törlés a megfelelő végpontokra megy', () => {
    service.saveWorkout({ muscleGroup: 'Hát' }).subscribe();
    expect(http.expectOne({ method: 'POST', url: '/api/workouts' })).toBeTruthy();

    service.updateWorkout('42', { muscleGroup: 'Láb' }).subscribe();
    expect(http.expectOne({ method: 'PUT', url: '/api/workouts/42' })).toBeTruthy();

    service.deleteWorkout('42').subscribe();
    expect(http.expectOne({ method: 'DELETE', url: '/api/workouts/42' })).toBeTruthy();
  });
});
