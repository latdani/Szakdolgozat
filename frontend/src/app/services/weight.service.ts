import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeightEntry {
  _id: string;
  day: string;    // "ÉÉÉÉ-HH-NN"
  weight: number; // kg
}

@Injectable({
  providedIn: 'root'
})
export class WeightService {
  private apiUrl = '/api/weights';

  constructor(private http: HttpClient) { }

  // A bejelentkezett felhasználó testsúly-előzményei, időrendben (legrégebbi elöl)
  getWeights(): Observable<WeightEntry[]> {
    return this.http.get<WeightEntry[]>(this.apiUrl);
  }

  // Ha az adott napra már van bejegyzés, a backend felülírja
  addWeight(weight: number, day: string): Observable<WeightEntry> {
    return this.http.post<WeightEntry>(this.apiUrl, { weight, day });
  }

  deleteWeight(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
