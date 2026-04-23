import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CoverageService } from '../services/coverage.service';
import { CoverageStateService } from '../services/coverage-state.service';
import { LocationService } from '../services/location.service';
import { CoverageOption, CoverageOptionRequest } from '../models/coverage.model';
import { LocationSummaryItem } from '../models/location.model';
import { SectionHeaderComponent } from '../../../shared/ui/atoms/section-header/section-header.component';
import { BtnComponent } from '../../../shared/ui/atoms/btn/btn.component';
import { LocationTabSelectorComponent } from '../components/coverages/location-tab-selector/location-tab-selector.component';
import { CoverageContextBarComponent } from '../components/coverages/coverage-context-bar/coverage-context-bar.component';
import { CoverageOptionsGridComponent } from '../components/coverages/coverage-options-grid/coverage-options-grid.component';

@Component({
  selector: 'app-technical-info-page',
  standalone: true,
  imports: [
    CommonModule,
    SectionHeaderComponent,
    BtnComponent,
    LocationTabSelectorComponent,
    CoverageContextBarComponent,
    CoverageOptionsGridComponent,
  ],
  templateUrl: './technical-info.page.html',
  styleUrl: './technical-info.page.scss',
})
export class TechnicalInfoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly coverageService = inject(CoverageService);
  private readonly coverageStateService = inject(CoverageStateService);
  private readonly locationService = inject(LocationService);
  private readonly destroyRef = inject(DestroyRef);

  protected folioNumber = '';
  protected coverageOptions: CoverageOption[] = [];
  protected version = 0;
  protected locations: LocationSummaryItem[] = [];
  protected activeLocationIndex = 1;
  protected saving = false;
  protected loading = false;
  protected error: string | null = null;
  protected successMessage: string | null = null;

  get activeLocation(): LocationSummaryItem | undefined {
    return this.locations.find(l => l.index === this.activeLocationIndex);
  }

  get otherLocations(): LocationSummaryItem[] {
    return this.locations.filter(l => l.index !== this.activeLocationIndex);
  }

  get activeCount(): number {
    return this.coverageOptions.filter(opt => opt.selected).length;
  }

  ngOnInit(): void {
    this.folioNumber = this.route.snapshot.params['folioNumber'] ?? '';
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      coverages: this.coverageService.obtener(this.folioNumber),
      summary: this.locationService.obtenerResumen(this.folioNumber),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ coverages, summary }) => {
          this.version = coverages.version;
          this.coverageOptions = this.coverageStateService.initializeOptions(coverages.coverageOptions);

          this.locations = summary.locations;
          if (this.locations.length > 0) {
            this.activeLocationIndex = this.locations[0].index;
          }

          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudieron cargar las coberturas. Intenta de nuevo.';
        },
      });
  }

  onRetry(): void {
    this.loadData();
  }

  onTabSelected(index: number): void {
    this.activeLocationIndex = index;
  }

  onApplyToAll(): void {
    // The coverage array is flat (shared across all locations).
    // "Apply to all" is a visual UX hint; the state is already shared.
    // No additional action is needed beyond keeping the current array.
  }

  onCopyFrom(sourceIndex: number): void {
    // Since the model is flat, copying from another location
    // simply keeps the current coverageOptions (all tabs share the same array).
    // The deep clone is prepared for future per-location extension.
    const cloned = structuredClone(this.coverageOptions);
    this.coverageOptions = cloned;
    void sourceIndex; // sourceIndex reserved for future per-location model
  }

  onCoverageChanged(updated: CoverageOption): void {
    this.coverageOptions = this.coverageStateService.updateCoverage(this.coverageOptions, updated);
    this.successMessage = null;
  }

  onSave(): void {
    this.saving = true;
    this.error = null;
    this.successMessage = null;

    const requests: CoverageOptionRequest[] = this.coverageStateService.buildRequests(this.coverageOptions);

    this.coverageService
      .guardar(this.folioNumber, requests, this.version)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.version = res.version;
          this.coverageOptions = res.coverageOptions;
          this.saving = false;
          this.successMessage = 'Coberturas guardadas correctamente.';
        },
        error: (err) => {
          this.saving = false;
          if (err.status === 409) {
            this.error =
              'Los datos han cambiado en otro proceso. Recarga para continuar.';
          } else {
            this.error = `Error al guardar las coberturas (${err.status ?? 'desconocido'}).`;
          }
        },
      });
  }
}
