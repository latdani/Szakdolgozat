import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private apiUrl = '/api/workouts';

  constructor(private http: HttpClient) {}

  // Új edzés mentése a szerverre
  saveWorkout(workoutData: any): Observable<any> {
    return this.http.post(this.apiUrl, workoutData);
  }

  // A bejelentkezett felhasználó összes edzésének lekérése (a backend a tokenből tudja, ki az)
  getUserWorkouts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  deleteWorkout(id: string) {
    return this.http.delete(`/api/workouts/${id}`);
  }
}


