import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('kezdetben nincs bejelentkezve senki', () => {
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getUser()).toBeNull();
  });

  it('felhasználó és token után bejelentkezettnek számít', () => {
    service.setUser({ id: '1', name: 'Teszt' });
    expect(service.isLoggedIn()).toBeFalse(); // token nélkül még nem
    service.setToken('abc');
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.getUser().name).toBe('Teszt');
  });

  it('kijelentkezéskor törli a felhasználót és a tokent', () => {
    service.setUser({ id: '1' });
    service.setToken('abc');
    service.logout();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('a bejelentkezés POST /api/login kérést küld', () => {
    service.login({ email: 'a@b.hu', password: 'jelszo123' }).subscribe();
    const req = http.expectOne('/api/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('a@b.hu');
    req.flush({ token: 't' });
  });

  it('a regisztráció POST /api/register kérést küld', () => {
    service.register({ email: 'a@b.hu', password: 'jelszo123' }).subscribe();
    const req = http.expectOne('/api/register');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
