import { TestBed } from '@angular/core/testing';
import { CoverageStateService } from './coverage-state.service';
import {
  CoverageOption,
  CoverageOptionRequest,
  DEFAULT_COVERAGE_OPTIONS,
} from '../models/coverage.model';

describe('CoverageStateService', () => {
  let service: CoverageStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoverageStateService);
  });

  // ---------------------------------------------------------------------------
  // initializeOptions
  // ---------------------------------------------------------------------------
  describe('initializeOptions', () => {
    it('should return DEFAULT_COVERAGE_OPTIONS when api array is empty', () => {
      const result = service.initializeOptions([]);
      expect(result.length).toBe(DEFAULT_COVERAGE_OPTIONS.length);
      result.forEach((opt, i) => {
        expect(opt.code).toBe(DEFAULT_COVERAGE_OPTIONS[i].code);
        expect(opt.selected).toBe(DEFAULT_COVERAGE_OPTIONS[i].selected);
        expect(opt.deductiblePercentage).toBe(DEFAULT_COVERAGE_OPTIONS[i].deductiblePercentage);
        expect(opt.coinsurancePercentage).toBe(DEFAULT_COVERAGE_OPTIONS[i].coinsurancePercentage);
      });
    });

    it('should return the api options when array is not empty', () => {
      const apiOptions: CoverageOption[] = [
        {
          code: 'COV-FIRE',
          description: 'Incendio',
          selected: true,
          deductiblePercentage: 2.0,
          coinsurancePercentage: 80.0,
        },
      ];
      const result = service.initializeOptions(apiOptions);
      expect(result).toBe(apiOptions);
    });

    it('should return a deep clone, not the same reference, when api array is empty', () => {
      const result = service.initializeOptions([]);
      expect(result).not.toBe(DEFAULT_COVERAGE_OPTIONS);
    });
  });

  // ---------------------------------------------------------------------------
  // updateCoverage
  // ---------------------------------------------------------------------------
  describe('updateCoverage', () => {
    const baseOptions: CoverageOption[] = [
      { code: 'COV-FIRE',  description: 'Incendio',  selected: false, deductiblePercentage: 2.0,  coinsurancePercentage: 80.0  },
      { code: 'COV-THEFT', description: 'Robo',      selected: false, deductiblePercentage: 5.0,  coinsurancePercentage: 100.0 },
    ];

    it('should replace the item matching by code', () => {
      const updated: CoverageOption = {
        code: 'COV-FIRE',
        description: 'Incendio',
        selected: true,
        deductiblePercentage: 2.0,
        coinsurancePercentage: 80.0,
      };
      const result = service.updateCoverage(baseOptions, updated);
      const fire = result.find(o => o.code === 'COV-FIRE');
      expect(fire?.selected).toBeTrue();
    });

    it('should not mutate the original array', () => {
      const original = baseOptions.map(o => ({ ...o }));
      const updated: CoverageOption = {
        code: 'COV-FIRE',
        description: 'Incendio',
        selected: true,
        deductiblePercentage: 2.0,
        coinsurancePercentage: 80.0,
      };
      service.updateCoverage(baseOptions, updated);
      expect(baseOptions[0].selected).toBe(original[0].selected);
    });

    it('should leave other items unchanged', () => {
      const updated: CoverageOption = {
        code: 'COV-FIRE',
        description: 'Incendio',
        selected: true,
        deductiblePercentage: 2.0,
        coinsurancePercentage: 80.0,
      };
      const result = service.updateCoverage(baseOptions, updated);
      const theft = result.find(o => o.code === 'COV-THEFT');
      expect(theft?.selected).toBeFalse();
    });

    it('should return array unchanged if code does not exist', () => {
      const updated: CoverageOption = {
        code: 'COV-GLASS',
        description: 'Vidrios',
        selected: true,
        deductiblePercentage: 5.0,
        coinsurancePercentage: 100.0,
      };
      const result = service.updateCoverage(baseOptions, updated);
      expect(result.length).toBe(baseOptions.length);
      expect(result.find((o: CoverageOption) => o.code === 'COV-GLASS')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // buildRequests
  // ---------------------------------------------------------------------------
  describe('buildRequests', () => {
    it('should map CoverageOption[] to CoverageOptionRequest[] with correct fields', () => {
      const options: CoverageOption[] = [
        {
          code: 'COV-FIRE',
          description: 'Incendio y riesgos adicionales',
          selected: true,
          deductiblePercentage: 2.0,
          coinsurancePercentage: 80.0,
        },
      ];
      const result: CoverageOptionRequest[] = service.buildRequests(options);
      expect(result[0].code).toBe('COV-FIRE');
      expect(result[0].selected).toBeTrue();
      expect(result[0].deductiblePercentage).toBe(2.0);
      expect(result[0].coinsurancePercentage).toBe(80.0);
    });

    it('should include all 6 items', () => {
      const result = service.buildRequests(DEFAULT_COVERAGE_OPTIONS);
      expect(result.length).toBe(6);
    });

    it('should not include the description field', () => {
      const result = service.buildRequests(DEFAULT_COVERAGE_OPTIONS);
      result.forEach((req: CoverageOptionRequest) => {
        expect((req as CoverageOptionRequest & { description?: string }).description).toBeUndefined();
      });
    });
  });
});
