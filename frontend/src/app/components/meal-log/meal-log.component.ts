import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MealService } from '../../services/meal.service';
import { AuthService } from '../../services/auth.service';



@Component({
  selector: 'app-meal-log',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './meal-log.component.html',
  styleUrls: ['./meal-log.component.css']
})
export class MealLogComponent implements OnInit {
  mealForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private mealService: MealService,
    private authService: AuthService
  ) {}

  // Add hozzá ezeket a változókat az osztály elejéhez (a mealForm alá):
  dailyGoal: number = 2500; // Egy fix napi cél (később majd jöhet adatbázisból)
  currentCalories: number = 0;
  savedDailyCalories: number = 0;
  currentFormCalories: number = 0;

  ngOnInit(): void {
    // 1. Az űrlap inicializálása (ez már megvan neked)
    this.mealForm = this.fb.group({
      mealType: ['', Validators.required],
      foods: this.fb.array([this.createFoodGroup()])
    });

    // 2. ÚJ: Figyeljük az űrlap változásait valós időben!
    this.mealForm.valueChanges.subscribe(() => {
      this.calculateCalories();
    });
  }

// ÚJ FÜGGVÉNYEK: Másold be ezeket a fájl aljára (az onSubmit fölé/alá)
  calculateCalories() {
    const foods = this.mealForm.get('foods')?.value || [];

    // Kiszámoljuk, mennyi van épp most beírva a mezőkbe
    this.currentFormCalories = foods.reduce((sum: number, food: any) => {
      return sum + (food.calories || 0);
    }, 0);

    // A félhold az eddig elmentett + a most beírt kalóriákat mutatja együtt!
    this.currentCalories = this.savedDailyCalories + this.currentFormCalories;
  }

// Ez számolja ki az SVG félhold kitöltöttségét
  getDashOffset(): number {
    const circumference = 282.74; // Egy 90-es sugarú félkör hossza
    // Kiszámoljuk a százalékot, de maximum 100% lehet (ne folyjon túl a csík)
    const percent = Math.min(this.currentCalories / this.dailyGoal, 1);
    return circumference - (percent * circumference);
  }

  get foods() {
    return this.mealForm.get('foods') as FormArray;
  }

  createFoodGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      calories: [0, [Validators.required, Validators.min(0)]],
      protein: [0],
      carbs: [0],
      fat: [0]
    });
  }

  addFood() {
    this.foods.push(this.createFoodGroup());
  }

  removeFood(index: number) {
    this.foods.removeAt(index);
  }

  onSubmit() {
    if (this.mealForm.invalid) return;

    // 1. Biztosra megyünk, hogy a kalóriák ki vannak számolva
    this.calculateCalories();

    // 2. Megszerezzük a felhasználó ID-ját.
    // Ha van már loginod és eltároltad az ID-t a localStorage-ben, akkor így szeded ki.
    // (Ha még nincs kész a login, a jobb oldali 'kamu' ID-t fogja használni, hogy tudj tesztelni!)
    const loggedInUserId = localStorage.getItem('userId') || '60d5ecb8b392d700153ef123';

    // 3. Összeállítjuk a teljes csomagot a MongoDB-nek
    const mealDataToSend = {
      ...this.mealForm.value,                   // Ebben van a mealType és a foods tömb
      totalCalories: this.currentFormCalories,  // Az aktuális űrlap kalóriája
      userId: loggedInUserId                    // A hiányzó felhasználó azonosító!
    };

    // 4. Elküldjük a Backendnek
    this.mealService.addMeal(mealDataToSend).subscribe({
      next: (res: any) => {
        console.log('Sikeres mentés!', res);

        // --- SIKERES MENTÉS UTÁNI TAKARÍTÁS ÉS FÉLHOLD FRISSÍTÉS ---

        // Hozzáadjuk a most megevett kalóriát a napi "memóriához"
        this.savedDailyCalories += this.currentFormCalories;

        // Kiürítjük a formot
        this.mealForm.reset();

        // Visszaállítjuk a legördülőt alapértelmezettre
        this.mealForm.get('mealType')?.setValue('');

        // Visszateszünk egyetlen üres sort az ételeknek
        this.mealForm.setControl('foods', this.fb.array([this.createFoodGroup()]));

        // Újraszámoljuk a félholdat (mivel az űrlap üres lett, csak a savedDailyCalories fog megjelenni!)
        this.calculateCalories();

      },
      error: (err: any) => {
        console.error('Hiba a mentés során:', err);
      }
    });
  }

  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectOption(value: string) {
    this.mealForm.get('mealType')?.setValue(value);
    this.dropdownOpen = false;
  }
}
