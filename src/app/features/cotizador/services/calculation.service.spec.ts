// TDD RED: this file is created BEFORE the service implementation
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CalculationService } from './calculation.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { CalculationResult } from '../models/calculation.model';

const API_URL = 'http://localhost:8080';

const mockAppConfigService: Partial<AppConfigService> = {
  get apiUrl() { return API_URL; },
};

const mockCalculationResult: CalculationResult = {
  folioNumber: 'FOL-2026-00042',
  quoteStatus: 'CALCULATED',
  netPremium: 48500.00,
  commercialPremium: 56260.00,
  premiumsByLocation: [
    {
      index: 1,
      locationName: 'Bodega Principal',
      netPremium: 48500.00,
      commercialPremium: 56260.00,
      calculable: true,
      coverageBreakdown: {
        fireBuildings: 20000.00,
        fireContents: 15000.00,
        coverageExtension: 3500.00,
        cattev: 4000.00,
        catfhm: 2500.00,
        debrisRemoval: 1500.00,
        extraordinaryExpenses: 1000.00,
        rentalLoss: 0.00,
        businessInterruption: 0.00,
        electronicEquipment: 500.00,
        theft: 0.00,
        cashAndValues: 0.00,
        glass: 0.00,
        luminousSignage: 0.00,
      },
      blockingAlerts: [],
    },
  ],
  calculatedAt: '2026-04-23T16:00:00Z',
  version: 8,
};

describe('CalculationService', () => {
  let service: CalculationService;
  let httpMock: HttpTestingController;
  const folio = 'FOL-2026-00042';
  const version = 7;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CalculationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    });
    service = TestBed.inject(CalculationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── calculate() — POST to correct URL with version body ─────────────────

  it('should POST to correct URL with version body and return CalculationResult on 200', () => {
    // GIVEN / WHEN
    service.calculate(folio, version).subscribe((res: CalculationResult) => {
      // THEN
      expect(res).toEqual(mockCalculationResult);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/calculate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ version });
    req.flush(mockCalculationResult);
  });

  // ─── calculate() — returns CALCULATED quoteStatus ────────────────────────

  it('should return CalculationResult with quoteStatus CALCULATED on success', () => {
    // GIVEN / WHEN
    service.calculate(folio, version).subscribe((res: CalculationResult) => {
      // THEN
      expect(res.quoteStatus).toBe('CALCULATED');
      expect(res.netPremium).toBe(48500.00);
      expect(res.commercialPremium).toBe(56260.00);
      expect(res.version).toBe(8);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/calculate`);
    req.flush(mockCalculationResult);
  });

  // ─── calculate() — 409 VERSION_CONFLICT ──────────────────────────────────

  it('should propagate HttpErrorResponse 409 when calculate() receives VERSION_CONFLICT', () => {
    // GIVEN / WHEN
    service.calculate(folio, version).subscribe({
      next: () => fail('expected a 409 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(409);
        expect(err.error.code).toBe('VERSION_CONFLICT');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/calculate`);
    req.flush(
      { error: 'Optimistic lock conflict', code: 'VERSION_CONFLICT' },
      { status: 409, statusText: 'Conflict' }
    );
  });

  // ─── calculate() — 422 NO_CALCULABLE_LOCATIONS ───────────────────────────

  it('should propagate HttpErrorResponse 422 when calculate() receives NO_CALCULABLE_LOCATIONS', () => {
    // GIVEN / WHEN
    service.calculate(folio, version).subscribe({
      next: () => fail('expected a 422 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(422);
        expect(err.error.code).toBe('NO_CALCULABLE_LOCATIONS');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/calculate`);
    req.flush(
      { error: 'No calculable locations', code: 'NO_CALCULABLE_LOCATIONS' },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
  });
});
