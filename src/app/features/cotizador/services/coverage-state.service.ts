import { Injectable } from '@angular/core';
import {
  CoverageOption,
  CoverageOptionRequest,
  DEFAULT_COVERAGE_OPTIONS,
} from '../models/coverage.model';

/**
 * Pure state-management service for coverage options.
 * No HTTP dependencies — only business logic for initialization,
 * immutable updates, and payload building.
 */
@Injectable({ providedIn: 'root' })
export class CoverageStateService {

  /**
   * Returns the given api options if the array is not empty.
   * When the api array is empty, returns a deep clone of DEFAULT_COVERAGE_OPTIONS.
   */
  initializeOptions(apiOptions: CoverageOption[]): CoverageOption[] {
    if (apiOptions.length > 0) {
      return apiOptions;
    }
    return structuredClone(DEFAULT_COVERAGE_OPTIONS);
  }

  /**
   * Returns a new array where the item whose code matches `updated.code`
   * is replaced by `updated`. Does not mutate the original array.
   */
  updateCoverage(current: CoverageOption[], updated: CoverageOption): CoverageOption[] {
    return current.map(opt => (opt.code === updated.code ? updated : opt));
  }

  /**
   * Maps CoverageOption[] to CoverageOptionRequest[], keeping only the fields
   * required by the PUT endpoint (code, selected, deductiblePercentage, coinsurancePercentage).
   */
  buildRequests(options: CoverageOption[]): CoverageOptionRequest[] {
    return options.map(opt => ({
      code: opt.code,
      selected: opt.selected,
      deductiblePercentage: opt.deductiblePercentage,
      coinsurancePercentage: opt.coinsurancePercentage,
    }));
  }
}
