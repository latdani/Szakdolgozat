import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { WorkoutService } from '../../services/workout.service';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private fb: FormBuilder,
    private workoutService: WorkoutService,
    private authService: AuthService
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
    const user = this.authService.getUser();
    if (user && user.id) {
      this.workoutService.getUserWorkouts(user.id).subscribe({
        next: (data) => {
          this.workouts = data;
        },
        error: (err) => console.error('Hiba a lekérésnél:', err)
      });
    }
  }

  createExercise(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      sets: [null, [Validators.required, Validators.min(1)]],
      reps: [null, [Validators.required, Validators.min(1)]],
      weight: [null, [Validators.required, Validators.min(0)]]
    });
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
      const user = this.authService.getUser();

      const workoutData = {
        userId: user.id,
        muscleGroup: this.workoutForm.value.muscleGroup,
        exercises: this.workoutForm.value.exercises
      };

      this.workoutService.saveWorkout(workoutData).subscribe({
        next: () => {
          this.loading = false;
          alert('Edzés sikeresen mentve!');
          this.showHistory = true;
          this.loadHistory();
          this.workoutForm.reset();

          // FormArray kitakarítása és egy üres sor hozzáadása
          while (this.exercises.length !== 0) {
            this.exercises.removeAt(0);
          }
          this.addExercise();
        },
        error: (err) => {
          this.loading = false;
          alert('Hiba történt a mentéskor!');
        }
      });
    }
  }
}
