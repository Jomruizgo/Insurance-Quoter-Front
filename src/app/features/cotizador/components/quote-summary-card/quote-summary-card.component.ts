import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge.component';
import { CalculationResult } from '../../models/calculation.model';
import { GeneralInfoResponse } from '../../models/general-info.model';

@Component({
  selector: 'app-quote-summary-card',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './quote-summary-card.component.html',
  styleUrl: './quote-summary-card.component.scss',
})
export class QuoteSummaryCardComponent {
  @Input({ required: true }) folioNumber!: string;
  @Input({ required: true }) result!: CalculationResult;
  @Input({ required: true }) generalInfo!: GeneralInfoResponse;

  get calculableLocations() {
    return this.result.premiumsByLocation.filter((loc) => loc.calculable);
  }
}
