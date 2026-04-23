import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'cotizador',
    loadChildren: () =>
      import('./features/cotizador/cotizador.routes').then(m => m.COTIZADOR_ROUTES),
  },
  { path: '', redirectTo: 'cotizador', pathMatch: 'full' },
];
