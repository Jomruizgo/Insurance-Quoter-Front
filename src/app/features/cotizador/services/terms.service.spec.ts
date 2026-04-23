// TDD RED: this file is created BEFORE the service implementation
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TermsService } from './terms.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { AcceptanceResponse } from '../models/terms.model';

const API_URL = 'http://localhost:8080';

const mockAppConfigService: Partial<AppConfigService> = {
  get apiUrl() { return API_URL; },
};

const mockAcceptanceResponse: AcceptanceResponse = {
  folioNumber: 'FOL-001',
  quoteStatus: 'ISSUED',
  acceptedBy: 'Juan',
  acceptedAt: '2026-04-23T18:30:00Z',
  version: 9,
};

describe('TermsService', () => {
  let service: TermsService;
  let httpMock: HttpTestingController;
  const folio = 'FOL-001';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TermsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    });
    service = TestBed.inject(TermsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── aceptar() — POST to correct URL with body ──────────────────────────

  it('should POST to correct URL with acceptedBy and version body', () => {
    // GIVEN / WHEN
    service.aceptar(folio, 'Juan', 8).subscribe();

    // THEN
    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/accept`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ acceptedBy: 'Juan', version: 8 });
    req.flush(mockAcceptanceResponse);
  });

  // ─── aceptar() — returns AcceptanceResponse with quoteStatus ISSUED ─────

  it('should return Observable<AcceptanceResponse> with quoteStatus ISSUED on 200', () => {
    // GIVEN / WHEN
    service.aceptar(folio, 'Juan', 8).subscribe((res: AcceptanceResponse) => {
      // THEN
      expect(res.quoteStatus).toBe('ISSUED');
      expect(res.folioNumber).toBe('FOL-001');
      expect(res.acceptedBy).toBe('Juan');
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/accept`);
    req.flush(mockAcceptanceResponse);
  });

  // ─── aceptar() — 409 VERSION_CONFLICT ───────────────────────────────────

  it('should propagate HttpErrorResponse 409 when aceptar() receives VERSION_CONFLICT', () => {
    // GIVEN / WHEN
    service.aceptar(folio, 'Juan', 8).subscribe({
      next: () => fail('expected a 409 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(409);
        expect(err.error.code).toBe('VERSION_CONFLICT');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/accept`);
    req.flush(
      { error: 'Optimistic lock conflict', code: 'VERSION_CONFLICT' },
      { status: 409, statusText: 'Conflict' }
    );
  });

  // ─── aceptar() — 422 INVALID_STATUS_TRANSITION ──────────────────────────

  it('should propagate HttpErrorResponse 422 when aceptar() receives INVALID_STATUS_TRANSITION', () => {
    // GIVEN / WHEN
    service.aceptar(folio, 'Juan', 8).subscribe({
      next: () => fail('expected a 422 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(422);
        expect(err.error.code).toBe('INVALID_STATUS_TRANSITION');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/accept`);
    req.flush(
      { error: 'Cannot transition to ISSUED', code: 'INVALID_STATUS_TRANSITION' },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
  });
});
