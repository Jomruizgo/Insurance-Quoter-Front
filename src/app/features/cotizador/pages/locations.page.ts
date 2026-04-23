import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-locations-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 2rem;">
      <p style="color: var(--text-dim, #666); font-size: 0.875rem;">
        Folio {{ folioNumber }} · Paso 3 de 5
      </p>
      <h2>Registro de ubicaciones</h2>
      <p>Esta sección está pendiente de implementación.</p>
    </div>
  `,
})
export class LocationsPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly folioNumber =
    this.route.snapshot.params['folioNumber'] ?? '';
}
