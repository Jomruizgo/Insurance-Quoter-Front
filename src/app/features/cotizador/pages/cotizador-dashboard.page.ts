import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cotizador-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="dashboard-stub"><p>Dashboard de cotizaciones</p></div>`,
  styles: [`.dashboard-stub { padding: 2rem; }`],
})
export class CotizadorDashboardPage {}
