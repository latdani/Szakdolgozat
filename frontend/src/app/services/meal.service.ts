import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MealService {
  private apiUrl = '/api/meals';

  constructor(private http: HttpClient) { }

  addMeal(mealData: any): Observable<any> {
    return this.http.post(this.apiUrl, mealData);
  }

  getMeals(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}`);
  }
}
