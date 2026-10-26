import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// A felhasználó céljának lehetséges értékei (a backend is ezeket fogadja el)
export const GOAL_OPTIONS = [
  { value: 'NotSet', label: 'Nincs megadva' },
  { value: 'MuscleGain', label: 'Izomnövelés' },
  { value: 'WeightLoss', label: 'Fogyás' },
  { value: 'Maintain', label: 'Szinten tartás' }
];

export interface Profile {
  name: string;
  email: string;
  goal: string;
  currentWeight: number;
  dailyCalorieGoal: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = '/api/profile';

  constructor(private http: HttpClient) { }

  // A bejelentkezett felhasználó profilja (a backend a tokenből tudja, ki az)
  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(this.apiUrl);
  }

  updateProfile(profile: Partial<Profile>): Observable<Profile> {
    return this.http.put<Profile>(this.apiUrl, profile);
  }
}
