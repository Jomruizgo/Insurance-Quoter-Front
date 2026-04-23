import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { CalculationService } from '../services/calculation.service';
import { GeneralInfoService } from '../services/general-info.service';
import { TermsService } from '../services/terms.service';
import { QuoteStateService } from '../../../core/services/quote-state.service';
import { CalculationResult } from '../models/calculation.model';
import { GeneralInfoResponse } from '../models/general-info.model';

import { QuoteSummaryCardComponent } from '../components/quote-summary-card/quote-summary-card.component';
import { TermsAndConditionsTextComponent } from '../components/terms-and-conditions-text/terms-and-conditions-text.component';
import { AcceptanceFormComponent } from '../components/acceptance-form/acceptance-form.component';
import { QuoteFinalizationBarComponent } from '../components/quote-finalization-bar/quote-finalization-bar.component';
import { BtnComponent } from '../../../shared/ui/atoms/btn/btn.component';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [
    CommonModule,
    QuoteSummaryCardComponent,
    TermsAndConditionsTextComponent,
    AcceptanceFormComponent,
    QuoteFinalizationBarComponent,
    BtnComponent,
  ],
  templateUrl: './terms.page.html',
  styleUrl: './terms.page.scss',
})
export class TermsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly calculationService = inject(CalculationService);
  private readonly generalInfoService = inject(GeneralInfoService);
  private readonly termsService = inject(TermsService);
  private readonly quoteStateService = inject(QuoteStateService);

  folioNumber = '';
  result: CalculationResult | null = null;
  generalInfo: GeneralInfoResponse | null = null;
  loading = true;
  accepting = false;
  accepted = false;
  acceptedFolio = '';
  error: string | null = null;
  acceptancePayload: { valid: boolean; acceptedBy: string } = { valid: false, acceptedBy: '' };

  constructor() {
    // takeUntilDestroyed must be used in constructor or field initializer
  }

  ngOnInit(): void {
    this.folioNumber = this.route.snapshot.params['folioNumber'];

    // Try to read result from router navigation state (Caso A)
    const navState = history.state as { result?: CalculationResult } | null;
    const stateResult: CalculationResult | undefined = navState?.['result'];

    if (stateResult) {
      // Caso A: result from navigation state — only load general info
      forkJoin({
        generalInfo: this.generalInfoService.cargar(this.folioNumber),
      })
        .pipe(
          catchError(() => {
            this.error = 'No se pudo cargar la información del folio. Intenta de nuevo.';
            return of(null);
          }),
          finalize(() => { this.loading = false; })
        )
        .subscribe((data) => {
          if (data) {
            this.result = stateResult;
            this.generalInfo = data.generalInfo;
          }
        });
    } else {
      // Caso B: access by direct URL — load both result and general info
      forkJoin({
        result: this.calculationService.obtenerResultado(this.folioNumber).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 404) {
              this.error = 'El resultado de cálculo no está disponible. Vuelve al paso de cálculo.';
            } else {
              this.error = 'No se pudo cargar el resultado de cálculo. Intenta de nuevo.';
            }
            return of(null);
          })
        ),
        generalInfo: this.generalInfoService.cargar(this.folioNumber).pipe(
          catchError(() => of(null))
        ),
      })
        .pipe(finalize(() => { this.loading = false; }))
        .subscribe((data) => {
          if (data?.result && data?.generalInfo) {
            this.result = data.result;
            this.generalInfo = data.generalInfo;
          } else if (!this.error) {
            this.error = 'No se pudo cargar la información del folio. Intenta de nuevo.';
          }
        });
    }
  }

  get submitEnabled(): boolean {
    return this.acceptancePayload.valid && !this.accepting && !this.accepted;
  }

  onFormChange(payload: { valid: boolean; acceptedBy: string }): void {
    this.acceptancePayload = payload;
  }

  onAccept(): void {
    if (!this.result || !this.submitEnabled) return;

    this.accepting = true;
    this.error = null;

    this.termsService
      .aceptar(this.folioNumber, this.acceptancePayload.acceptedBy, this.result.version)
      .pipe(finalize(() => { this.accepting = false; }))
      .subscribe({
        next: () => {
          this.accepted = true;
          this.acceptedFolio = this.folioNumber;
          this.quoteStateService.refresh();
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 409) {
            this.error = 'El folio fue modificado por otro usuario. Recarga la página para continuar.';
          } else if (err.status === 422) {
            this.error = 'No se puede finalizar el folio. Verifica que el cálculo esté vigente.';
          } else {
            this.error = 'Ocurrió un error al finalizar la cotización. Intenta de nuevo.';
          }
        },
      });
  }

  onDownloadPdf(): void {
    window.print();
  }

  onBack(): void {
    this.router.navigate(['/cotizador', 'quotes', this.folioNumber, 'calculation']);
  }

  onBackToDashboard(): void {
    this.router.navigate(['/cotizador']);
  }
}
