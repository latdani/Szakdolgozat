import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeHu from '@angular/common/locales/hu';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';

// Magyar dátum- és számformátum a pipe-okhoz (pl. | date: "október" az "October" helyett)
registerLocaleData(localeHu);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: LOCALE_ID, useValue: 'hu' },
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
