import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { WorkoutService } from '../../services/workout.service';

@Component({
  selector: 'app-workout-log',
  standalone: true,
  // A CommonModule elengedhetetlen a HTML-ben lévő *ngIf, *ngFor és a Pipe-ok (| date) használatához
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './workout-log.component.html',
  styleUrls: ['./workout-log.component.css']
})
export class WorkoutLogComponent implements OnInit {
  workoutForm: FormGroup;
  workouts: any[] = [];
  showHistory: boolean = true;
  loading: boolean = false;
  editingWorkoutId: string | null = null; // Ha nem null, az űrlap ezt az edzést szerkeszti

  constructor(
    private fb: FormBuilder,
    private workoutService: WorkoutService
  ) {
    // Az űrlap inicializálása
    this.workoutForm = this.fb.group({
      muscleGroup: ['', Validators.required],
      exercises: this.fb.array([this.createExercise()])
    });
  }

  ngOnInit() {
    this.loadHistory();
  }

  // Ez a getter kritikus a HTML-ben lévő [formGroupName] és *ngFor-hoz
  get exercises(): FormArray {
    return this.workoutForm.get('exercises') as FormArray;
  }

  loadHistory() {
    this.workoutService.getUserWorkouts().subscribe({
      next: (data) => {
        this.workouts = data;
      },
      error: (err) => console.error('Hiba a lekérésnél:', err)
    });
  }

  createExercise(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      sets: [null, [Validators.required, Validators.min(1)]],
      reps: [null, [Validators.required, Validators.min(1)]],
      weight: [null, [Validators.required, Validators.min(0)]]
    });
  }

  // Váltás az előzmények és az űrlap között; az előzményekhez visszalépve a szerkesztés megszakad
  toggleView() {
    if (this.showHistory) {
      this.showHistory = false;
    } else {
      this.cancelEdit();
    }
  }

  // Egy mentett edzés betöltése az űrlapba szerkesztéshez
  startEdit(workout: any) {
    this.editingWorkoutId = workout._id;
    this.workoutForm.get('muscleGroup')?.setValue(workout.muscleGroup);
    this.workoutForm.setControl('exercises', this.fb.array(
      workout.exercises.map((ex: any) => {
        const group = this.createExercise();
        group.patchValue(ex);
        return group;
      })
    ));
    this.showHistory = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.resetForm();
    this.showHistory = true;
  }

  // Üres űrlap egy gyakorlat sorral, szerkesztési mód vége
  private resetForm() {
    this.editingWorkoutId = null;
    this.workoutForm.reset();
    this.workoutForm.setControl('exercises', this.fb.array([this.createExercise()]));
  }

  deleteWorkout(id: string) {
    if (confirm('Biztosan törölni szeretnéd ezt az edzést?')) {
      this.workoutService.deleteWorkout(id).subscribe({
        next: () => {
          // Frissítjük a listát a törlés után
          this.workouts = this.workouts.filter(w => w._id !== id);
        },
        error: (err) => alert('Nem sikerült a törlés!')
      });
    }
  }

  addExercise() {
    this.exercises.push(this.createExercise());
  }

  removeExercise(index: number) {
    if (this.exercises.length > 1) {
      this.exercises.removeAt(index);
    }
  }

  onSubmit() {
    if (this.workoutForm.valid) {
      this.loading = true;

      // A felhasználó azonosítóját a backend a tokenből veszi
      const workoutData = {
        muscleGroup: this.workoutForm.value.muscleGroup,
        exercises: this.workoutForm.value.exercises
      };

      // Szerkesztésnél módosítás, egyébként új edzés mentése
      const request = this.editingWorkoutId
        ? this.workoutService.updateWorkout(this.editingWorkoutId, workoutData)
        : this.workoutService.saveWorkout(workoutData);
      const successMessage = this.editingWorkoutId ? 'Edzés sikeresen módosítva!' : 'Edzés sikeresen mentve!';

      request.subscribe({
        next: () => {
          this.loading = false;
          alert(successMessage);
          this.showHistory = true;
          this.loadHistory();
          this.resetForm();
        },
        error: (err) => {
          this.loading = false;
          alert('Hiba történt a mentéskor!');
        }
      });
    }
  }
}
