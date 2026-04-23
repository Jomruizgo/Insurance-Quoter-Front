import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CatalogService } from './catalog.service';
import { AppConfigService } from './app-config.service';
import { Subscriber, Agent, BusinessLine } from '../models/catalog.model';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8080';
  const CORE_URL = 'http://localhost:8081';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AppConfigService,
          useValue: { apiUrl: 'http://localhost:8080', coreUrl: CORE_URL },
        },
      ],
    });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('obtenerSuscriptores()', () => {
    const mockSubscribers: Subscriber[] = [
      { id: 'SUB-001', name: 'Suscriptor Uno' },
      { id: 'SUB-002', name: 'Suscriptor Dos' },
    ];

    it('should GET /v1/subscribers and return Subscriber[]', () => {
      service.obtenerSuscriptores().subscribe(list => {
        expect(list.length).toBe(2);
        expect(list[0].id).toBe('SUB-001');
      });

      const req = httpMock.expectOne(`${CORE_URL}/v1/subscribers`);
      expect(req.request.method).toBe('GET');
      req.flush({ subscribers: mockSubscribers });
    });

    it('should return cached result on second call (shareReplay)', () => {
      let callCount = 0;

      service.obtenerSuscriptores().subscribe(() => callCount++);
      service.obtenerSuscriptores().subscribe(() => callCount++);

      const requests = httpMock.match(`${CORE_URL}/v1/subscribers`);
      expect(requests.length).toBe(1);
      requests[0].flush({ subscribers: mockSubscribers });

      expect(callCount).toBe(2);
    });
  });

  describe('obtenerAgentes()', () => {
    const mockAgents: Agent[] = [
      { code: 'AGT-123', name: 'Agente Uno', subscriberId: 'SUB-001' },
      { code: 'AGT-456', name: 'Agente Dos', subscriberId: 'SUB-002' },
    ];

    it('should GET /v1/agents and return Agent[]', () => {
      service.obtenerAgentes().subscribe(list => {
        expect(list.length).toBe(2);
        expect(list[0].code).toBe('AGT-123');
      });

      const req = httpMock.expectOne(`${CORE_URL}/v1/agents`);
      expect(req.request.method).toBe('GET');
      req.flush({ agents: mockAgents });
    });

    it('should return cached result on second call (shareReplay)', () => {
      let callCount = 0;

      service.obtenerAgentes().subscribe(() => callCount++);
      service.obtenerAgentes().subscribe(() => callCount++);

      const requests = httpMock.match(`${CORE_URL}/v1/agents`);
      expect(requests.length).toBe(1);
      requests[0].flush({ agents: mockAgents });

      expect(callCount).toBe(2);
    });
  });

  describe('obtenerGiros()', () => {
    const mockBusinessLines: BusinessLine[] = [
      { code: 'BL-001', description: 'Bodega de mercancías', fireKey: 'FK-INC-01' },
      { code: 'BL-002', description: 'Oficinas', fireKey: 'FK-INC-02' },
    ];

    it('should GET /v1/business-lines and return BusinessLine[]', () => {
      service.obtenerGiros().subscribe(list => {
        expect(list.length).toBe(2);
        expect(list[0].code).toBe('BL-001');
        expect(list[0].fireKey).toBe('FK-INC-01');
      });

      const req = httpMock.expectOne(`${API_URL}/v1/business-lines`);
      expect(req.request.method).toBe('GET');
      req.flush({ businessLines: mockBusinessLines });
    });

    it('should use shareReplay(1) — second subscription does not trigger a new HTTP call', () => {
      let callCount = 0;

      service.obtenerGiros().subscribe(() => callCount++);
      service.obtenerGiros().subscribe(() => callCount++);

      const requests = httpMock.match(`${API_URL}/v1/business-lines`);
      expect(requests.length).toBe(1);
      requests[0].flush({ businessLines: mockBusinessLines });

      expect(callCount).toBe(2);
    });

    it('should reset cache and retry HTTP call after an error', () => {
      let errorReceived = false;

      // GIVEN: first call fails
      service.obtenerGiros().subscribe({
        next: () => fail('expected an error'),
        error: () => { errorReceived = true; },
      });

      const req1 = httpMock.expectOne(`${API_URL}/v1/business-lines`);
      req1.flush({ error: 'Server Error' }, { status: 500, statusText: 'Server Error' });

      expect(errorReceived).toBeTrue();

      // WHEN: second call is made after the error
      service.obtenerGiros().subscribe();

      // THEN: a new HTTP request is triggered (cache was reset)
      const req2 = httpMock.expectOne(`${API_URL}/v1/business-lines`);
      req2.flush({ businessLines: mockBusinessLines });
    });
  });

  describe('obtenerSuscriptores() — error recovery', () => {
    it('should reset cache and retry after error', () => {
      let errorReceived = false;

      service.obtenerSuscriptores().subscribe({
        next: () => fail('expected an error'),
        error: () => { errorReceived = true; },
      });

      const req1 = httpMock.expectOne(`${CORE_URL}/v1/subscribers`);
      req1.flush({}, { status: 503, statusText: 'Service Unavailable' });

      expect(errorReceived).toBeTrue();

      service.obtenerSuscriptores().subscribe();
      const req2 = httpMock.expectOne(`${CORE_URL}/v1/subscribers`);
      req2.flush({ subscribers: [] });
    });
  });

  describe('obtenerAgentes() — error recovery', () => {
    it('should reset cache and retry after error', () => {
      let errorReceived = false;

      service.obtenerAgentes().subscribe({
        next: () => fail('expected an error'),
        error: () => { errorReceived = true; },
      });

      const req1 = httpMock.expectOne(`${CORE_URL}/v1/agents`);
      req1.flush({}, { status: 503, statusText: 'Service Unavailable' });

      expect(errorReceived).toBeTrue();

      service.obtenerAgentes().subscribe();
      const req2 = httpMock.expectOne(`${CORE_URL}/v1/agents`);
      req2.flush({ agents: [] });
    });
  });
});
