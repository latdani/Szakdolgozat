import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GOAL_OPTIONS, ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService
  ) {
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
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.message || 'Nem sikerült menteni a profilt.';
      }
    });
  }
}
