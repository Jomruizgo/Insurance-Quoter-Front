import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../../shared/ui/templates/main-layout/main-layout.component';
import { CotizadorDashboardPage } from './pages/cotizador-dashboard.page';
import { GeneralInfoPage } from './pages/general-info.page';
import { LayoutPage } from './pages/layout.page';
import { LocationsPageComponent } from './pages/locations/locations-page.component';
import { TechnicalInfoPage } from './pages/technical-info.page';
import { TermsPage } from './pages/terms.page';

export const COTIZADOR_ROUTES: Routes = [
  { path: '', component: CotizadorDashboardPage },
  {
    path: 'quotes/:folioNumber',
    component: MainLayoutComponent,
    children: [
      { path: 'general-info',         component: GeneralInfoPage },
      { path: 'layout',               component: LayoutPage },
      { path: 'locations',            component: LocationsPageComponent },
      { path: 'technical-info',       component: TechnicalInfoPage },
      { path: 'terms-and-conditions', component: TermsPage },
      { path: '', redirectTo: 'general-info', pathMatch: 'full' },
    ],
  },
];
