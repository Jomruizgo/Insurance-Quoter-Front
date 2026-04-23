import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FolioService } from './folio.service';
import { AppConfigService } from './app-config.service';
import { FolioResponse } from '../models/folio.model';

describe('FolioService', () => {
  let service: FolioService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8080';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AppConfigService,
          useValue: { apiUrl: API_URL, coreUrl: 'http://localhost:8081' },
        },
      ],
    });
    service = TestBed.inject(FolioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('crearFolio()', () => {
    const mockResponse: FolioResponse = {
      folioNumber: 'FOL-2026-00042',
      quoteStatus: 'CREATED',
      underwritingData: { subscriberId: 'SUB-001', agentCode: 'AGT-123' },
      createdAt: '2026-04-22T00:00:00Z',
      version: 1,
    };

    it('should POST to /v1/folios and return FolioResponse on 201', () => {
      service.crearFolio('SUB-001', 'AGT-123').subscribe(res => {
        expect(res.folioNumber).toBe('FOL-2026-00042');
        expect(res.quoteStatus).toBe('CREATED');
      });

      const req = httpMock.expectOne(`${API_URL}/v1/folios`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ subscriberId: 'SUB-001', agentCode: 'AGT-123' });
      req.flush(mockResponse, { status: 201, statusText: 'Created' });
    });

    it('should handle idempotent 200 response identically to 201', () => {
      service.crearFolio('SUB-001', 'AGT-123').subscribe(res => {
        expect(res.folioNumber).toBe('FOL-2026-00042');
      });

      const req = httpMock.expectOne(`${API_URL}/v1/folios`);
      req.flush(mockResponse, { status: 200, statusText: 'OK' });
    });

    it('should propagate error on 400 INVALID_REFERENCE', () => {
      let errorReceived = false;
      service.crearFolio('BAD', 'BAD').subscribe({
        next: () => fail('should not emit'),
        error: err => {
          errorReceived = true;
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${API_URL}/v1/folios`);
      req.flush({ error: 'Invalid subscriber or agent', code: 'INVALID_REFERENCE' }, { status: 400, statusText: 'Bad Request' });
      expect(errorReceived).toBeTrue();
    });
  });
});
