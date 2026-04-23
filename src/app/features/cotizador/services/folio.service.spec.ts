import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FolioListService, USE_MOCK_FOLIOS } from './folio.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { FolioSummary, FolioListResponse } from '../models/folio-summary.model';

const API_URL = 'http://localhost:8080';

const STUB_FOLIOS: FolioSummary[] = [
  {
    folioNumber: 'FOL-2026-00001',
    client: 'Empresa Alfa SA de CV',
    agentCode: 'AGT-001',
    agentName: 'Carlos López',
    status: 'CREATED',
    locationCount: 1,
    completionPct: 10,
    commercialPremium: null,
    updatedAt: '2026-04-20T10:00:00Z',
  },
  {
    folioNumber: 'FOL-2026-00002',
    client: 'Grupo Beta SRL',
    agentCode: 'AGT-002',
    agentName: 'María García',
    status: 'IN_PROGRESS',
    locationCount: 3,
    completionPct: 60,
    commercialPremium: 125000,
    updatedAt: '2026-04-21T09:00:00Z',
  },
];

describe('FolioListService', () => {
  let service: FolioListService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: USE_MOCK_FOLIOS, useValue: false }, // disable mock to test real HTTP path
        {
          provide: AppConfigService,
          useValue: { apiUrl: API_URL, coreUrl: 'http://localhost:8081' },
        },
      ],
    });
    service = TestBed.inject(FolioListService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listFolios()', () => {
    it('should call GET /v1/folios', () => {
      // GIVEN
      const mockResponse: FolioListResponse = { folios: STUB_FOLIOS };

      // WHEN
      service.listFolios().subscribe();

      // THEN
      const req = httpMock.expectOne(`${API_URL}/v1/folios`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return Observable<FolioSummary[]> mapping response.folios', () => {
      // GIVEN
      const mockResponse: FolioListResponse = { folios: STUB_FOLIOS };
      let result: FolioSummary[] = [];

      // WHEN
      service.listFolios().subscribe(folios => (result = folios));
      const req = httpMock.expectOne(`${API_URL}/v1/folios`);
      req.flush(mockResponse);

      // THEN
      expect(result.length).toBe(2);
      expect(result[0].folioNumber).toBe('FOL-2026-00001');
      expect(result[1].status).toBe('IN_PROGRESS');
    });

    it('should propagate error when request fails', () => {
      // GIVEN
      let errorReceived = false;

      // WHEN
      service.listFolios().subscribe({
        next: () => fail('should not emit'),
        error: err => {
          errorReceived = true;
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${API_URL}/v1/folios`);
      req.flush({ error: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });

      // THEN
      expect(errorReceived).toBeTrue();
    });
  });
});
