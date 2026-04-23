// TDD RED: this file is created BEFORE the service implementation
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LayoutConfigService } from './layout-config.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import {
  LayoutConfigResponse,
  LayoutConfiguration,
  SaveLayoutConfigRequest,
} from '../models/layout-config.model';

const API_URL = 'http://localhost:8080';

const mockAppConfigService: Partial<AppConfigService> = {
  get apiUrl() { return API_URL; }
};

const mockLayoutConfiguration: LayoutConfiguration = {
  numberOfLocations: 3,
  locationType: 'MULTIPLE',
};

const mockResponse: LayoutConfigResponse = {
  folioNumber: 'FOL-2026-00042',
  layoutConfiguration: mockLayoutConfiguration,
  version: 3,
};

const mockSaveRequest: SaveLayoutConfigRequest = {
  layoutConfiguration: mockLayoutConfiguration,
  version: 3,
};

describe('LayoutConfigService', () => {
  let service: LayoutConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LayoutConfigService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    });
    service = TestBed.inject(LayoutConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── load() ──────────────────────────────────────────────────────────────

  it('should emit GET to /v1/quotes/{folio}/locations/layout when load() is called', () => {
    // GIVEN
    const folio = 'FOL-2026-00042';

    // WHEN
    service.load(folio).subscribe();

    // THEN
    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/layout`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return Observable<LayoutConfigResponse> when load() succeeds', () => {
    // GIVEN
    const folio = 'FOL-2026-00042';

    // WHEN
    service.load(folio).subscribe((res: LayoutConfigResponse) => {
      // THEN
      expect(res).toEqual(mockResponse);
      expect(res.folioNumber).toBe('FOL-2026-00042');
      expect(res.layoutConfiguration.numberOfLocations).toBe(3);
      expect(res.layoutConfiguration.locationType).toBe('MULTIPLE');
      expect(res.version).toBe(3);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/layout`);
    req.flush(mockResponse);
  });

  it('should propagate HTTP 404 error when load() receives not found', () => {
    // GIVEN
    const folio = 'FOL-9999-00000';

    // WHEN
    service.load(folio).subscribe({
      next: () => fail('expected an error'),
      // THEN
      error: (err: { status: number }) => expect(err.status).toBe(404),
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/layout`);
    req.flush(
      { error: 'Folio not found', code: 'FOLIO_NOT_FOUND' },
      { status: 404, statusText: 'Not Found' }
    );
  });

  // ─── save() ──────────────────────────────────────────────────────────────

  it('should emit PUT to /v1/quotes/{folio}/locations/layout with correct body when save() is called', () => {
    // GIVEN
    const folio = 'FOL-2026-00042';
    const updatedResponse: LayoutConfigResponse = { ...mockResponse, version: 4 };

    // WHEN
    service.save(folio, mockLayoutConfiguration, 3).subscribe((res: LayoutConfigResponse) => {
      // THEN
      expect(res).toEqual(updatedResponse);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/layout`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockSaveRequest);
    req.flush(updatedResponse);
  });

  it('should include version in the request body when save() is called', () => {
    // GIVEN
    const folio = 'FOL-2026-00042';
    const version = 7;

    // WHEN
    service.save(folio, mockLayoutConfiguration, version).subscribe();

    // THEN
    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/layout`);
    expect(req.request.body.version).toBe(7);
    req.flush({ ...mockResponse, version: 8 });
  });

  it('should propagate HTTP 409 VERSION_CONFLICT error without transforming when save() receives conflict', () => {
    // GIVEN
    const folio = 'FOL-2026-00042';

    // WHEN
    service.save(folio, mockLayoutConfiguration, 3).subscribe({
      next: () => fail('expected a 409 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(409);
        expect(err.error.code).toBe('VERSION_CONFLICT');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/layout`);
    req.flush(
      { error: 'Optimistic lock conflict', code: 'VERSION_CONFLICT' },
      { status: 409, statusText: 'Conflict' }
    );
  });
});
