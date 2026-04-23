import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationsSummary } from '../../models/location.model';

@Component({
  selector: 'app-locations-alert-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (summary.incompleteLocations > 0) {
      <div class="alert-banner alert-banner--warn">
        <span class="alert-banner__icon">&#9888;</span>
        <span class="alert-banner__text">
          {{ summary.incompleteLocations }} ubicación{{ summary.incompleteLocations !== 1 ? 'es' : '' }}
          con alertas bloqueantes afectarán el cálculo de prima
        </span>
        <button class="alert-banner__btn" type="button" (click)="verDetalles.emit()">
          Ver detalles
        </button>
      </div>
    }
  `,
  styles: [`
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }
    .alert-banner--warn {
      background-color: #fff7ed;
      border: 1px solid #fed7aa;
      color: #9a3412;
    }
    .alert-banner__icon {
      font-size: 1rem;
      flex-shrink: 0;
    }
    .alert-banner__text {
      flex: 1;
    }
    .alert-banner__btn {
      padding: 0.25rem 0.75rem;
      background: transparent;
      border: 1px solid currentColor;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.8rem;
      color: inherit;
    }
    .alert-banner__btn:hover {
      background-color: rgba(0,0,0,0.05);
    }
  `],
})
export class LocationsAlertBannerComponent {
  @Input() summary!: LocationsSummary;
  @Output() verDetalles = new EventEmitter<void>();
}
