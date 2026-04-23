import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge.component';
import { CalculationResult, LocationPremium } from '../../models/calculation.model';

@Component({
  selector: 'app-premium-summary',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './premium-summary.component.html',
  styleUrl: './premium-summary.component.scss',
})
export class PremiumSummaryComponent {
  @Input() result!: CalculationResult;

  get locationList(): LocationPremium[] {
    return this.result.premiumsByLocation;
  }
}
