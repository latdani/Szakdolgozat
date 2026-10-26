import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  // Az alkalmazás fő funkciói (kártyák)
  features = [
    { icon: 'fa-dumbbell', title: 'Edzésnapló', text: 'Edzések rögzítése izomcsoporttal, gyakorlatonként súllyal, szettel és ismétlésszámmal.' },
    { icon: 'fa-utensils', title: 'Étkezésnapló', text: 'Étkezések és ételek rögzítése kalóriával és makrotápanyagokkal, napi kalóriakijelzővel.' },
    { icon: 'fa-chart-line', title: 'Statisztikák', text: 'Heti edzésszám, edzésvolumen és napi kalóriabevitel diagramokon.' },
    { icon: 'fa-user-cog', title: 'Személyre szabás', text: 'Saját testsúly, cél és napi kalóriacél, amit a napló és a statisztikák is figyelembe vesznek.' }
  ];

  // A felhasznált technológiák
  technologies = [
    { icon: 'fab fa-angular', title: 'Angular', text: 'Frontend keretrendszer (TypeScript, standalone komponensek, reaktív űrlapok).' },
    { icon: 'fab fa-node-js', title: 'Node.js + Express', text: 'Backend szerver és REST API.' },
    { icon: 'fas fa-database', title: 'MongoDB', text: 'Dokumentum alapú adatbázis a felhőben (MongoDB Atlas), Mongoose-zal.' },
    { icon: 'fas fa-shield-alt', title: 'JWT + bcrypt', text: 'Tokenes bejelentkezés és biztonságosan tárolt (hash-elt) jelszavak.' }
  ];
}
