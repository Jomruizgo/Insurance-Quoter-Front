import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LayoutConfigService } from '../services/layout-config.service';
import { LayoutConfigFormComponent } from '../components/layout-config-form/layout-config-form.component';
import { LayoutConfigResponse } from '../models/layout-config.model';
import { QuoteStateService } from '../../../core/services/quote-state.service';

@Component({
  selector: 'app-layout-page',
  standalone: true,
  imports: [CommonModule, LayoutConfigFormComponent],
  templateUrl: './layout.page.html',
  styleUrl: './layout.page.scss',
})
export class LayoutPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly layoutConfigService = inject(LayoutConfigService);
  private readonly quoteStateService = inject(QuoteStateService);
  private readonly destroyRef = inject(DestroyRef);

  protected folioNumber = '';

  protected readonly layoutData = signal<LayoutConfigResponse | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadFailed = signal(false);

  ngOnInit(): void {
    this.folioNumber = this.route.snapshot.params['folioNumber'] ?? '';
    this.doLoad();
  }

  protected retryLoad(): void {
    this.errorMessage.set(null);
    this.loadFailed.set(false);
    this.doLoad();
  }

  private doLoad(): void {
    this.loading.set(true);

    this.layoutConfigService
      .load(this.folioNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.layoutData.set(data);
          this.loadFailed.set(false);
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.errorMessage.set(
            'No se pudo cargar la configuración previa. Recarga para continuar.'
          );
          this.loading.set(false);
        },
      });
  }

  onSaved(data: LayoutConfigResponse): void {
    this.saving.set(true);
    this.errorMessage.set(null);

    this.layoutConfigService
      .save(this.folioNumber, data.layoutConfiguration, data.version)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          // R-003: trigger stepper re-fetch in MainLayoutComponent via refresh$
          this.quoteStateService.refresh();
          this.router.navigate(['/quotes', this.folioNumber, 'locations']);
        },
        error: (err: { status: number; error?: { code?: string; fields?: unknown[] } }) => {
          this.saving.set(false);
          // R-001: validate both status and error code to avoid false positives
          if (err.status === 409 && err.error?.code === 'VERSION_CONFLICT') {
            this.errorMessage.set(
              'El folio fue modificado desde otra sesión. Recarga la página para continuar.'
            );
          // R-002: handle backend validation errors explicitly
          } else if (err.status === 422) {
            this.errorMessage.set(
              'Los datos enviados no son válidos según el servidor. Verifica los campos e intenta de nuevo.'
            );
          } else {
            this.errorMessage.set(
              `Error al guardar la configuración (${err.status ?? 'desconocido'}). Intenta de nuevo.`
            );
          }
        },
      });
  }
}
