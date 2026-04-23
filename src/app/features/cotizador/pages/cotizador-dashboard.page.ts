import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap } from 'rxjs';

import { FolioListService } from '../services/folio-list.service';
import { DashboardFilterService } from '../services/dashboard-filter.service';
import { FolioSummary, DashboardFilters, DashboardStats, ViewMode } from '../models/folio-summary.model';

import { FolioFiltersComponent } from '../components/folio-filters/folio-filters.component';
import { FolioSummaryTableComponent } from '../components/folio-summary-table/folio-summary-table.component';
import { FolioSummaryGridComponent } from '../components/folio-summary-grid/folio-summary-grid.component';
import { NewFolioModalComponent } from '../components/new-folio-modal/new-folio-modal.component';
import { StatCardComponent } from '../../../shared/ui/atoms/stat-card/stat-card.component';
import { BtnComponent } from '../../../shared/ui/atoms/btn/btn.component';

@Component({
  selector: 'app-cotizador-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FolioFiltersComponent,
    FolioSummaryTableComponent,
    FolioSummaryGridComponent,
    NewFolioModalComponent,
    StatCardComponent,
    BtnComponent,
  ],
  templateUrl: './cotizador-dashboard.page.html',
  styleUrl: './cotizador-dashboard.page.scss',
})
export class CotizadorDashboardPage implements OnInit {
  private readonly folioService = inject(FolioListService);
  private readonly filterService = inject(DashboardFilterService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected folios: FolioSummary[] = [];
  protected isLoading = true;
  protected hasError = false;
  protected isModalOpen = false;

  protected filters: DashboardFilters = { searchText: '', statusFilter: 'ALL' };
  protected viewMode: ViewMode = 'list';

  // Single trigger for initial load + retries — switchMap cancels in-flight requests
  private readonly loadTrigger$ = new Subject<void>();

  // Stats always reflect the full (unfiltered) folio list — business rule
  protected get stats(): DashboardStats {
    return this.filterService.computeStats(this.folios);
  }

  // Folios shown in table/grid — derived from filters
  protected get filteredFolios(): FolioSummary[] {
    return this.filterService.filterFolios(this.folios, this.filters);
  }

  ngOnInit(): void {
    this.loadTrigger$
      .pipe(
        switchMap(() => this.folioService.listFolios()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: folios => {
          this.folios = folios;
          this.isLoading = false;
          this.hasError = false;
        },
        error: () => {
          this.hasError = true;
          this.isLoading = false;
        },
      });

    this.loadTrigger$.next();
  }

  protected onFiltersChange(filters: DashboardFilters): void {
    this.filters = filters;
  }

  protected onViewModeChange(mode: ViewMode): void {
    this.viewMode = mode;
  }

  // R-003: guard against empty/invalid folioNumber before navigating
  protected onFolioClick(folioNumber: string): void {
    if (!folioNumber?.trim()) {
      return;
    }
    this.router.navigate(['/quotes', folioNumber, 'general-info']);
  }

  protected openNewFolioModal(): void {
    this.isModalOpen = true;
  }

  protected onModalClosed(): void {
    this.isModalOpen = false;
  }

  protected retry(): void {
    this.hasError = false;
    this.isLoading = true;
    this.loadTrigger$.next();
  }

  protected formatPremium(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
