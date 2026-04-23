import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalculationResult,
  CoverageBreakdown,
  LocationPremium,
  TECHNICAL_COMPONENTS,
} from '../../models/calculation.model';

@Component({
  selector: 'app-premium-breakdown-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './premium-breakdown-table.component.html',
  styleUrl: './premium-breakdown-table.component.scss',
})
export class PremiumBreakdownTableComponent {
  @Input() result!: CalculationResult;

  readonly technicalComponents = TECHNICAL_COMPONENTS;

  get calculableLocations(): LocationPremium[] {
    return this.result.premiumsByLocation.filter(p => p.calculable);
  }

  getCellValue(p: LocationPremium, key: keyof CoverageBreakdown): number | null {
    const val = p.coverageBreakdown?.[key] ?? null;
    if (val === null || val === 0) return null;
    return val;
  }

  getRowTotal(key: keyof CoverageBreakdown): number {
    return this.calculableLocations.reduce(
      (sum, p) => sum + (p.coverageBreakdown?.[key] ?? 0),
      0
    );
  }

  getNetPremiumTotal(): number {
    return this.calculableLocations.reduce(
      (sum, p) => sum + (p.netPremium ?? 0),
      0
    );
  }
}
