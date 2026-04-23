// TDD RED: this file is created BEFORE the service implementation
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GeneralInfoService } from './general-info.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { GeneralInfoRequest, GeneralInfoResponse } from '../models/general-info.model';

const API_URL = 'http://localhost:8080';

const mockAppConfigService: Partial<AppConfigService> = {
  get apiUrl() { return API_URL; }
};

const mockResponse: GeneralInfoResponse = {
  folioNumber: 'FOL-2026-00042',
  quoteStatus: 'IN_PROGRESS',
  insuredData: {
    name: 'Empresa Ejemplo SA de CV',
    rfc: 'EEJ900101ABC',
    email: 'contacto@empresa.com',
    phone: '5512345678',
  },
  underwritingData: {
    subscriberId: 'SUB-001',
    agentCode: 'AGT-123',
    riskClassification: 'STANDARD',
    businessType: 'COMMERCIAL',
  },
  updatedAt: '2026-04-20T15:00:00Z',
  version: 2,
};

const mockRequest: GeneralInfoRequest = {
  insuredData: mockResponse.insuredData,
  underwritingData: mockResponse.underwritingData,
  version: 2,
};

describe('GeneralInfoService', () => {
  let service: GeneralInfoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GeneralInfoService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    });
    service = TestBed.inject(GeneralInfoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── cargar() ────────────────────────────────────────────────────────────

  it('should emit GeneralInfoResponse when cargar() succeeds', () => {
    // GIVEN
    const folio = 'FOL-2026-00042';

    // WHEN
    service.cargar(folio).subscribe(res => {
      // THEN
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/general-info`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should propagate HTTP 404 error when cargar() receives not found', () => {
    // GIVEN
    const folio = 'FOL-9999-00000';

    // WHEN
    service.cargar(folio).subscribe({
      next: () => fail('expected an error'),
      // THEN
      error: (err) => expect(err.status).toBe(404),
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/general-info`);
    req.flush({ error: 'Folio not found', code: 'FOLIO_NOT_FOUND' }, { status: 404, statusText: 'Not Found' });
  });

  // ─── guardar() ───────────────────────────────────────────────────────────

  it('should call PUT with request body and return GeneralInfoResponse when guardar() succeeds', () => {
    // GIVEN
    const folio = 'FOL-2026-00042';
    const updatedResponse: GeneralInfoResponse = { ...mockResponse, version: 3 };

    // WHEN
    service.guardar(folio, mockRequest).subscribe(res => {
      // THEN
      expect(res).toEqual(updatedResponse);
      expect(res.version).toBe(3);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/general-info`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(updatedResponse);
  });

  it('should propagate HTTP 409 VERSION_CONFLICT error when guardar() receives conflict', () => {
    // GIVEN
    const folio = 'FOL-2026-00042';

    // WHEN
    service.guardar(folio, mockRequest).subscribe({
      next: () => fail('expected a 409 error'),
      // THEN
      error: (err) => {
        expect(err.status).toBe(409);
        expect(err.error.code).toBe('VERSION_CONFLICT');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/general-info`);
    req.flush(
      { error: 'Optimistic lock conflict', code: 'VERSION_CONFLICT' },
      { status: 409, statusText: 'Conflict' }
    );
  });

  it('should propagate HTTP 422 VALIDATION_ERROR when guardar() receives unprocessable entity', () => {
    // GIVEN
    const folio = 'FOL-2026-00042';

    // WHEN
    service.guardar(folio, mockRequest).subscribe({
      next: () => fail('expected a 422 error'),
      // THEN
      error: (err) => {
        expect(err.status).toBe(422);
        expect(err.error.code).toBe('VALIDATION_ERROR');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/general-info`);
    req.flush(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', fields: [] },
      { status: 422, statusText: 'Unprocessable Entity' }
    );
  });
});
