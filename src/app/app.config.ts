import { APP_INITIALIZER, ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsMX from '@angular/common/locales/es-MX';

import { routes } from './app.routes';
import { AppConfigService } from './core/services/app-config.service';
import { USE_MOCK_FOLIOS } from './features/cotizador/services/folio-list.service';

registerLocaleData(localeEsMX);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'es-MX' },
    {
      provide: APP_INITIALIZER,
      useFactory: (cfg: AppConfigService) => () => cfg.load(),
      deps: [AppConfigService],
      multi: true,
    },
    { provide: USE_MOCK_FOLIOS, useValue: false },
  ],
};
