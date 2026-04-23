import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CatalogService } from './catalog.service';
import { AppConfigService } from './app-config.service';
import { Subscriber, Agent } from '../models/catalog.model';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;
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
});
