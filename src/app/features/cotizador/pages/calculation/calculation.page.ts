import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalculationService } from '../../services/calculation.service';
import { QuoteStateService } from '../../../../core/services/quote-state.service';
import { LocationService } from '../../services/location.service';
import { CalculationResult, LocationPremium } from '../../models/calculation.model';
import { SectionHeaderComponent } from '../../../../shared/ui/atoms/section-header/section-header.component';
import { BtnComponent } from '../../../../shared/ui/atoms/btn/btn.component';
import { CalculationTriggerComponent } from '../../components/calculation-trigger/calculation-trigger.component';
import { PremiumSummaryComponent } from '../../components/premium-summary/premium-summary.component';
import { PremiumBreakdownTableComponent } from '../../components/premium-breakdown-table/premium-breakdown-table.component';
import { IncompleteLocationsAlertComponent } from '../../../../shared/ui/molecules/incomplete-locations-alert/incomplete-locations-alert.component';

@Component({
  selector: 'app-calculation-page',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    BtnComponent,
    CalculationTriggerComponent,
    PremiumSummaryComponent,
    PremiumBreakdownTableComponent,
    IncompleteLocationsAlertComponent,
  ],
  templateUrl: './calculation.page.html',
  styleUrl: './calculation.page.scss',
})
export class CalculationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly calculationService = inject(CalculationService);
  private readonly quoteStateService = inject(QuoteStateService);
  private readonly locationService = inject(LocationService);
  private readonly destroyRef = inject(DestroyRef);

  protected folioNumber = '';
  protected result: CalculationResult | null = null;
  protected calculating = false;
  protected error: string | null = null;
  protected calculableCount = 0;
  protected incompleteCount = 0;
  protected version = 0;

  get incompleteLocations(): LocationPremium[] {
    return this.result?.premiumsByLocation.filter(p => !p.calculable) ?? [];
  }

  ngOnInit(): void {
    this.folioNumber = this.route.snapshot.params['folioNumber'] ?? '';
    this.loadSummary();
  }

  private loadSummary(): void {
    this.locationService
      .obtenerResumen(this.folioNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.calculableCount = summary.completeLocations;
          this.incompleteCount = summary.incompleteLocations;
        },
        error: () => {
          // Non-blocking — continue with defaults (0 counts)
        },
      });

    this.quoteStateService
      .obtenerEstado(this.folioNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (state) => {
          this.version = state.version;
        },
        error: () => {
          // Non-blocking — version defaults to 0
        },
      });
  }

  onCalculate(): void {
    this.calculating = true;
    this.error = null;

    this.calculationService
      .calculate(this.folioNumber, this.version)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.result = res;
          this.version = res.version;
          this.calculating = false;
          this.quoteStateService.refresh();
        },
        error: (err) => {
          this.calculating = false;
          if (err.status === 422) {
            this.error =
              'No hay ubicaciones calculables. Completa al menos una ubicación antes de calcular.';
          } else if (err.status === 409) {
            this.error =
              'El folio fue modificado por otro usuario. Recarga la página para continuar.';
          } else {
            this.error = 'Error al ejecutar el cálculo. Intenta de nuevo.';
          }
        },
      });
  }

  onRecalculate(): void {
    this.result = null;
    this.error = null;
  }

  protected onDownloadPdf(): void {
    window.print();
  }

  onContinue(): void {
    this.router.navigate(['/cotizador', 'quotes', this.folioNumber, 'terms-and-conditions']);
  }
}
