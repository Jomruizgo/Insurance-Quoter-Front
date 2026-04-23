// TDD RED: this file is created BEFORE the service implementation
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CoverageService } from './coverage.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import {
  CoverageOption,
  CoverageOptionRequest,
  CoverageOptionsResponse,
} from '../models/coverage.model';

const API_URL = 'http://localhost:8080';

const mockAppConfigService: Partial<AppConfigService> = {
  get apiUrl() { return API_URL; },
};

const mockCoverageOptions: CoverageOption[] = [
  { code: 'COV-FIRE',  description: 'Incendio y riesgos adicionales',       selected: true,  deductiblePercentage: 2.0,  coinsurancePercentage: 80.0  },
  { code: 'COV-CAT',   description: 'Cobertura catastrófica CATTEV/CATFHM', selected: false, deductiblePercentage: 3.0,  coinsurancePercentage: 90.0  },
  { code: 'COV-THEFT', description: 'Robo con violencia',                   selected: false, deductiblePercentage: 5.0,  coinsurancePercentage: 100.0 },
  { code: 'COV-BI',    description: 'Pérdida de rentas / BI',               selected: false, deductiblePercentage: 3.0,  coinsurancePercentage: 80.0  },
  { code: 'COV-ELEC',  description: 'Equipo electrónico',                   selected: false, deductiblePercentage: 10.0, coinsurancePercentage: 100.0 },
  { code: 'COV-GLASS', description: 'Vidrios',                              selected: false, deductiblePercentage: 5.0,  coinsurancePercentage: 100.0 },
];

const mockResponse: CoverageOptionsResponse = {
  folioNumber: 'FOL-2026-00042',
  coverageOptions: mockCoverageOptions,
  version: 6,
};

const mockCoverageRequests: CoverageOptionRequest[] = mockCoverageOptions.map(opt => ({
  code: opt.code,
  selected: opt.selected,
  deductiblePercentage: opt.deductiblePercentage,
  coinsurancePercentage: opt.coinsurancePercentage,
}));

describe('CoverageService', () => {
  let service: CoverageService;
  let httpMock: HttpTestingController;
  const folio = 'FOL-2026-00042';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CoverageService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    });
    service = TestBed.inject(CoverageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── obtener() — happy path ──────────────────────────────────────────────

  it('should GET coverage-options and return CoverageOptionsResponse on 200', () => {
    // GIVEN / WHEN
    service.obtener(folio).subscribe((res: CoverageOptionsResponse) => {
      // THEN
      expect(res).toEqual(mockResponse);
      expect(res.coverageOptions.length).toBe(6);
      expect(res.version).toBe(6);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/coverage-options`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // ─── obtener() — 404 FOLIO_NOT_FOUND ────────────────────────────────────

  it('should propagate 404 with FOLIO_NOT_FOUND code when obtener() receives not found', () => {
    // GIVEN / WHEN
    service.obtener(folio).subscribe({
      next: () => fail('expected a 404 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(404);
        expect(err.error.code).toBe('FOLIO_NOT_FOUND');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/coverage-options`);
    req.flush(
      { error: 'Folio not found', code: 'FOLIO_NOT_FOUND' },
      { status: 404, statusText: 'Not Found' }
    );
  });

  // ─── guardar() — builds correct PUT body ────────────────────────────────

  it('should PUT coverage-options with coverageOptions array and version in body', () => {
    // GIVEN
    const version = 6;

    // WHEN
    service.guardar(folio, mockCoverageRequests, version).subscribe();

    // THEN
    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/coverage-options`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ coverageOptions: mockCoverageRequests, version });
    req.flush({ ...mockResponse, version: 7 });
  });

  // ─── guardar() — returns updated response ───────────────────────────────

  it('should return updated CoverageOptionsResponse with new version after guardar()', () => {
    // GIVEN
    const version = 6;
    const updatedResponse: CoverageOptionsResponse = {
      ...mockResponse,
      version: 7,
      updatedAt: '2026-04-22T15:45:00Z',
    };

    // WHEN
    service.guardar(folio, mockCoverageRequests, version).subscribe((res: CoverageOptionsResponse) => {
      // THEN
      expect(res.version).toBe(7);
      expect(res.updatedAt).toBe('2026-04-22T15:45:00Z');
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/coverage-options`);
    req.flush(updatedResponse);
  });

  // ─── guardar() — 409 VERSION_CONFLICT ───────────────────────────────────

  it('should propagate HttpErrorResponse 409 when guardar() receives conflict', () => {
    // GIVEN
    const version = 5; // stale version

    // WHEN
    service.guardar(folio, mockCoverageRequests, version).subscribe({
      next: () => fail('expected a 409 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(409);
        expect(err.error.code).toBe('VERSION_CONFLICT');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/coverage-options`);
    req.flush(
      { error: 'Optimistic lock conflict', code: 'VERSION_CONFLICT' },
      { status: 409, statusText: 'Conflict' }
    );
  });

  // ─── guardar() — 422 VALIDATION_ERROR ───────────────────────────────────

  it('should propagate HttpErrorResponse 422 when guardar() receives validation error', () => {
    // GIVEN
    const version = 6;

    // WHEN
    service.guardar(folio, mockCoverageRequests, version).subscribe({
      next: () => fail('expected a 422 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(422);
        expect(err.error.code).toBe('VALIDATION_ERROR');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/coverage-options`);
    req.flush(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', fields: [] },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
  });
});
