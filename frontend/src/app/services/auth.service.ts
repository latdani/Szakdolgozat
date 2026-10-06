import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  // 1. Elmenti a felhasználó adatait a böngészőbe
  setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // 2. Lekéri az elmentett felhasználót (ha van)
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // 3. A szervertől kapott bejelentkezési token (JWT) tárolása és lekérése
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 4. Ellenőrzi, hogy be van-e jelentkezve valaki (token nélkül a backend úgyis elutasítana)
  isLoggedIn(): boolean {
    return localStorage.getItem('user') !== null && this.getToken() !== null;
  }

  // 5. Kijelentkezés (törli az adatokat)
  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  // Regisztráció hívása
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Bejelentkezés hívása
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
}
