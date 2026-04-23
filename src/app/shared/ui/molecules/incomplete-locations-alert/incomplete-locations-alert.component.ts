import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon.component';
import { LocationPremium } from '../../../../features/cotizador/models/calculation.model';

@Component({
  selector: 'app-incomplete-locations-alert',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './incomplete-locations-alert.component.html',
  styleUrl: './incomplete-locations-alert.component.scss',
})
export class IncompleteLocationsAlertComponent {
  @Input() incompleteLocations: LocationPremium[] = [];

  get isVisible(): boolean {
    return this.incompleteLocations.length > 0;
  }
}
