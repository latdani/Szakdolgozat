import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  // Nagyon fontos: ezek a modulok kellenek a HTML-ben használt [formGroup]-hoz és routerLink-hez
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // A form mezőinek definiálása és alapvető ellenőrzése (validáció)
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: (res: any) => {
          // Mivel a backend most már visszaadja a 'user' objektumot:
          this.authService.setUser(res.user);

          alert('Sikeres regisztráció és automatikus belépés!');
          this.router.navigate(['/']); // Rögtön a főoldalra megyünk
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Hiba a regisztráció során.';
        }
      });
    }
  }
}
