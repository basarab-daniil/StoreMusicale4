import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Configurazione zoneless stabile nativa per Angular 22+
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient()
  ]
};
