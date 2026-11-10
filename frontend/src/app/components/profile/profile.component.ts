import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GOAL_OPTIONS, ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { WeightEntry, WeightService } from '../../services/weight.service';

// A mai nap helyi idő szerint "ÉÉÉÉ-HH-NN" alakban (ezt várja a dátum mező és a backend is)
function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  goalOptions = GOAL_OPTIONS;
  email = '';
  loading = true;
  saving = false;
  message = '';      // Sikeres mentés üzenete
  errorMessage = '';

  // Testsúly-előzmények (a lista a legújabbal kezdődik)
  weights: WeightEntry[] = [];
  weightForm: FormGroup;
  today = todayString();
  weightError = '';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private weightService: WeightService
  ) {
    this.weightForm = this.fb.group({
      day: [this.today, Validators.required],
      weight: [null, [Validators.required, Validators.min(1), Validators.max(500)]]
    });

    // A határok ugyanazok, mint a backend sémában
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      currentWeight: [0, [Validators.required, Validators.min(0), Validators.max(500)]],
      goal: ['NotSet', Validators.required],
      dailyCalorieGoal: [2500, [Validators.required, Validators.min(500), Validators.max(10000)]]
    });
  }

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.email = profile.email;
        this.profileForm.patchValue(profile);
        this.loading = false;
      },
      error: (err) => {
        console.error('Hiba a profil lekérésekor:', err);
        this.errorMessage = 'Nem sikerült betölteni a profilt.';
        this.loading = false;
      }
    });

    // Ha a felhasználó újra módosít, a korábbi üzenet eltűnik
    this.profileForm.valueChanges.subscribe(() => this.message = '');

    this.loadWeights();
  }

  loadWeights() {
    this.weightService.getWeights().subscribe({
      next: (weights) => {
        this.weights = [...weights].reverse();
        // A backend a legutolsó bejegyzést állítja be jelenlegi testsúlynak, a profil űrlap is ezt mutassa
        if (this.weights.length > 0) {
          this.profileForm.patchValue({ currentWeight: this.weights[0].weight }, { emitEvent: false });
        }
      },
      error: (err) => console.error('Hiba a testsúlyok lekérésekor:', err)
    });
  }

  addWeight() {
    if (this.weightForm.invalid) return;
    const { weight, day } = this.weightForm.value;
    this.weightError = '';
    this.weightService.addWeight(weight, day).subscribe({
      next: () => {
        this.weightForm.reset({ day: this.today, weight: null });
        this.loadWeights();
      },
      error: (err) => this.weightError = err.error?.message || 'Nem sikerült menteni a testsúlyt.'
    });
  }

  deleteWeight(entry: WeightEntry) {
    if (!confirm(`Törlöd a(z) ${entry.day} napi bejegyzést (${entry.weight} kg)?`)) return;
    this.weightService.deleteWeight(entry._id).subscribe({
      next: () => this.loadWeights(),
      error: () => this.weightError = 'Nem sikerült törölni a bejegyzést.'
    });
  }

  // A bejegyzés változása az előzőhöz (időben korábbihoz) képest, pl. "-0,5"
  weightChange(index: number): number | null {
    const older = this.weights[index + 1];
    if (!older) return null;
    return Math.round((this.weights[index].weight - older.weight) * 10) / 10;
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    this.saving = true;
    this.errorMessage = '';
    this.profileService.updateProfile(this.profileForm.value).subscribe({
      next: (profile) => {
        this.saving = false;
        this.profileForm.patchValue(profile, { emitEvent: false });
        this.message = 'Profil elmentve!';

        // A navbar a localStorage-ban lévő nevet mutatja, ezt is frissítjük
        this.authService.setUser({ ...this.authService.getUser(), name: profile.name });

        // Megváltozott testsúly esetén a backend mai bejegyzést is készít
        this.loadWeights();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Nem sikerült menteni a profilt.';
      }
    });
  }
}
