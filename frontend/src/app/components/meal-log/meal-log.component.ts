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
  meals: any[] = []; // A felhasználó mentett étkezései (legújabb elöl)

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

    // 3. Betöltjük a korábban mentett étkezéseket
    this.loadMeals();
  }

  loadMeals() {
    const user = this.authService.getUser();
    if (!user?.id) return;

    this.mealService.getMeals(user.id).subscribe({
      next: (data) => {
        this.meals = data;
        this.updateSavedCalories();
      },
      error: (err) => console.error('Hiba az étkezések lekérésekor:', err)
    });
  }

  // A mai napon mentett étkezések kalóriáit adja össze (ezt mutatja a félhold)
  updateSavedCalories() {
    const today = new Date().toDateString();
    this.savedDailyCalories = this.meals
      .filter(meal => new Date(meal.date).toDateString() === today)
      .reduce((sum, meal) => sum + (meal.totalCalories || 0), 0);
    this.calculateCalories();
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

    // 2. A bejelentkezett felhasználó ID-ja (az AuthGuard miatt mindig van belépett user)
    const user = this.authService.getUser();
    if (!user?.id) return;

    // 3. Összeállítjuk a teljes csomagot a MongoDB-nek
    const mealDataToSend = {
      ...this.mealForm.value,                   // Ebben van a mealType és a foods tömb
      totalCalories: this.currentFormCalories,  // Az aktuális űrlap kalóriája
      userId: user.id                           // A bejelentkezett felhasználó azonosítója
    };

    // 4. Elküldjük a Backendnek
    this.mealService.addMeal(mealDataToSend).subscribe({
      next: (res: any) => {
        // --- SIKERES MENTÉS UTÁNI TAKARÍTÁS ÉS FÉLHOLD FRISSÍTÉS ---

        // Az új étkezés a lista elejére kerül, a napi összeg ebből számolódik újra
        this.meals.unshift(res);
        this.updateSavedCalories();

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
        alert('Hiba történt a mentéskor!');
      }
    });
  }

  deleteMeal(id: string) {
    if (!confirm('Biztosan törölni szeretnéd ezt az étkezést?')) return;

    this.mealService.deleteMeal(id).subscribe({
      next: () => {
        this.meals = this.meals.filter(meal => meal._id !== id);
        this.updateSavedCalories();
      },
      error: () => alert('Nem sikerült a törlés!')
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
