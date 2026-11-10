import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { MealLogComponent } from './meal-log.component';

describe('MealLogComponent', () => {
  let component: MealLogComponent;
  let fixture: ComponentFixture<MealLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealLogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MealLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
