import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MealService } from '../../services/meal.service';
import { ProfileService } from '../../services/profile.service';



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
  editingMealId: string | null = null; // Ha nem null, az űrlap ezt az étkezést szerkeszti

  constructor(
    private fb: FormBuilder,
    private mealService: MealService,
    private profileService: ProfileService
  ) {}

  // Add hozzá ezeket a változókat az osztály elejéhez (a mealForm alá):
  dailyGoal: number = 2500; // A profilban beállított napi cél (betöltésig az alapértelmezett)
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

    // 3. Betöltjük a korábban mentett étkezéseket és a profilból a napi kalóriacélt
    this.loadMeals();
    this.profileService.getProfile().subscribe({
      next: (profile) => this.dailyGoal = profile.dailyCalorieGoal,
      error: (err) => console.error('Hiba a profil lekérésekor:', err)
    });
  }

  loadMeals() {
    this.mealService.getMeals().subscribe({
      next: (data) => {
        this.meals = data;
        this.updateSavedCalories();
      },
      error: (err) => console.error('Hiba az étkezések lekérésekor:', err)
    });
  }

  // A mai napon mentett étkezések kalóriáit adja össze (ezt mutatja a félhold).
  // A szerkesztés alatt álló étkezés kimarad, mert annak kalóriája az űrlapban van (különben duplán számolnánk)
  updateSavedCalories() {
    const today = new Date().toDateString();
    this.savedDailyCalories = this.meals
      .filter(meal => meal._id !== this.editingMealId && new Date(meal.date).toDateString() === today)
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

    // 2. Összeállítjuk a teljes csomagot a MongoDB-nek
    // (a felhasználó azonosítóját a backend a tokenből veszi)
    const mealDataToSend = {
      ...this.mealForm.value,                   // Ebben van a mealType és a foods tömb
      totalCalories: this.currentFormCalories   // Az aktuális űrlap kalóriája
    };

    // 3. Elküldjük a Backendnek: szerkesztésnél módosítás, egyébként új étkezés
    const request = this.editingMealId
      ? this.mealService.updateMeal(this.editingMealId, mealDataToSend)
      : this.mealService.addMeal(mealDataToSend);

    request.subscribe({
      next: (res: any) => {
        if (this.editingMealId) {
          // A módosított étkezés a régi helyére kerül
          this.meals = this.meals.map(meal => meal._id === res._id ? res : meal);
        } else {
          // Az új étkezés a lista elejére kerül
          this.meals.unshift(res);
        }
        // Kiürítjük a formot, a félhold a napi összegből újraszámolódik
        this.resetForm();
      },
      error: (err: any) => {
        console.error('Hiba a mentés során:', err);
        alert('Hiba történt a mentéskor!');
      }
    });
  }

  // Egy mentett étkezés betöltése az űrlapba szerkesztéshez
  startEdit(meal: any) {
    this.editingMealId = meal._id;
    this.mealForm.get('mealType')?.setValue(meal.mealType);
    this.mealForm.setControl('foods', this.fb.array(
      meal.foods.map((food: any) => {
        const group = this.createFoodGroup();
        group.patchValue(food);
        return group;
      })
    ));
    this.updateSavedCalories();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.resetForm();
  }

  // Üres űrlap egy étel sorral, szerkesztési mód vége
  private resetForm() {
    this.editingMealId = null;
    this.mealForm.reset();
    this.mealForm.get('mealType')?.setValue('');
    this.mealForm.setControl('foods', this.fb.array([this.createFoodGroup()]));
    this.updateSavedCalories();
  }

  deleteMeal(id: string) {
    if (!confirm('Biztosan törölni szeretnéd ezt az étkezést?')) return;

    this.mealService.deleteMeal(id).subscribe({
      next: () => {
        this.meals = this.meals.filter(meal => meal._id !== id);
        if (this.editingMealId === id) {
          this.resetForm(); // A szerkesztett étkezés törlődött, nincs mit tovább szerkeszteni
        } else {
          this.updateSavedCalories();
        }
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
