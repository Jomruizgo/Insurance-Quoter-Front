import { Injectable } from '@angular/core';
import { FolioSummary, DashboardFilters, DashboardStats } from '../models/folio-summary.model';

@Injectable({ providedIn: 'root' })
export class DashboardFilterService {
  /**
   * Applies text and status filters cumulatively (AND logic).
   * Pure function — no HTTP, no side effects.
   */
  filterFolios(folios: FolioSummary[], filters: DashboardFilters): FolioSummary[] {
    const text = filters.searchText.trim().toLowerCase();
    const status = filters.statusFilter;

    return folios.filter(folio => {
      const matchesText =
        text === '' ||
        folio.folioNumber.toLowerCase().includes(text) ||
        folio.client.toLowerCase().includes(text);

      const matchesStatus = status === 'ALL' || folio.status === status;

      return matchesText && matchesStatus;
    });
  }

  /**
   * Computes dashboard header statistics from the full (unfiltered) folios array.
   * Pure function — no HTTP, no side effects.
   */
  computeStats(folios: FolioSummary[]): DashboardStats {
    const total = folios.length;

    const inProgress = folios.filter(f => f.status === 'IN_PROGRESS').length;

    const readyToIssue = folios.filter(
      f => f.status === 'CALCULATED' || f.status === 'ISSUED'
    ).length;

    const accumulatedPremium = folios.reduce((sum, f) => {
      return f.commercialPremium !== null ? sum + f.commercialPremium : sum;
    }, 0);

    return { total, inProgress, readyToIssue, accumulatedPremium };
  }
}
