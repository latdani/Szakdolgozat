import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// Közös lábléc a Kezdőlap és a Rólunk oldal alján
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  year = new Date().getFullYear();
}
