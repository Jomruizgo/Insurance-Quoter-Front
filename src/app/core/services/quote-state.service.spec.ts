import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { QuoteStateService } from './quote-state.service';
import { AppConfigService } from './app-config.service';
import { QuoteState } from '../models/folio.model';

describe('QuoteStateService', () => {
  let service: QuoteStateService;
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
    service = TestBed.inject(QuoteStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('obtenerEstado()', () => {
    const mockState: QuoteState = {
      folioNumber: 'FOL-2026-00042',
      quoteStatus: 'IN_PROGRESS',
      completionPercentage: 75,
      sections: {
        generalInfo: 'COMPLETE',
        layout: 'COMPLETE',
        locations: 'INCOMPLETE',
        coverageOptions: 'PENDING',
        calculation: 'PENDING',
      },
      version: 2,
      updatedAt: '2026-04-22T10:00:00Z',
    };

    it('should GET /v1/quotes/{folio}/state and return QuoteState on 200', () => {
      service.obtenerEstado('FOL-2026-00042').subscribe(state => {
        expect(state.folioNumber).toBe('FOL-2026-00042');
        expect(state.completionPercentage).toBe(75);
        expect(state.sections.generalInfo).toBe('COMPLETE');
      });

      const req = httpMock.expectOne(`${API_URL}/v1/quotes/FOL-2026-00042/state`);
      expect(req.request.method).toBe('GET');
      req.flush(mockState);
    });

    it('should propagate error on 404 FOLIO_NOT_FOUND', () => {
      let errorReceived = false;
      service.obtenerEstado('FOL-DOES-NOT-EXIST').subscribe({
        next: () => fail('should not emit'),
        error: err => {
          errorReceived = true;
          expect(err.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${API_URL}/v1/quotes/FOL-DOES-NOT-EXIST/state`);
      req.flush({ error: 'Folio not found', code: 'FOLIO_NOT_FOUND' }, { status: 404, statusText: 'Not Found' });
      expect(errorReceived).toBeTrue();
    });
  });
});
