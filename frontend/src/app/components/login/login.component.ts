import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: []
})
export class LoginComponent implements OnInit { // Hozzáadva: implements OnInit
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // Hozzáadva: route injektálása
  ) {
    // A form definiálása validátorokkal
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Figyeljük az URL paramétereket az induláskor
    // Ha a Guard az ?auth=required paraméterrel küld ide, megjelenítjük az üzenetet
    this.route.queryParams.subscribe(params => {
      if (params['auth'] === 'required') {
        this.errorMessage = 'A funkció használatához kérlek, jelentkezz be!';
      }
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          // 1. Elmentjük a kapott júzert a localStorage-ba
          this.authService.setUser(res.user);

          // 2. Visszajelzés és átirányítás a főoldalra
          console.log('Sikeres belépés, adatok mentve!');
          this.router.navigate(['/']);
        },
        error: (err) => {
          // Megjelenítjük a szerver által küldött hibaüzenetet vagy egy alapértelmezettet
          this.errorMessage = err.error?.message || 'Hibás e-mail vagy jelszó!';
        }
      });
    }
  }
}
