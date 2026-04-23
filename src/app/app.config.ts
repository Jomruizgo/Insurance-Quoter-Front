import { APP_INITIALIZER, ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { AppConfigService } from './core/services/app-config.service';
import { USE_MOCK_FOLIOS } from './features/cotizador/services/folio-list.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: (cfg: AppConfigService) => () => cfg.load(),
      deps: [AppConfigService],
      multi: true,
    },
    { provide: USE_MOCK_FOLIOS, useValue: isDevMode() },
  ],
};
