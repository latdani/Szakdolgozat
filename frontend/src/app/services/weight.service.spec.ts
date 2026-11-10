import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WeightService } from './weight.service';

describe('WeightService', () => {
  let service: WeightService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(WeightService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('a rögzítés a súlyt és a napot küldi el', () => {
    service.addWeight(82.5, '2026-11-10').subscribe();
    const req = http.expectOne({ method: 'POST', url: '/api/weights' });
    expect(req.request.body).toEqual({ weight: 82.5, day: '2026-11-10' });
    req.flush({});
  });

  it('lekérés és törlés a megfelelő végpontokra megy', () => {
    let weights: any[] | undefined;
    service.getWeights().subscribe(w => weights = w);
    http.expectOne({ method: 'GET', url: '/api/weights' }).flush([{ day: '2026-11-10', weight: 82 }]);
    expect(weights?.length).toBe(1);

    service.deleteWeight('abc').subscribe();
    const del = http.expectOne({ method: 'DELETE', url: '/api/weights/abc' });
    expect(del.request.method).toBe('DELETE');
    del.flush({});
  });
});
