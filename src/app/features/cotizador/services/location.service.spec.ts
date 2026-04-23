// TDD RED: this file is created BEFORE the service implementation
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LocationService } from './location.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import {
  LocationsResponse,
  LocationsSummary,
  LocationResponse,
  Location,
  LocationPatchRequest,
} from '../models/location.model';

const API_URL = 'http://localhost:8080';

const mockAppConfigService: Partial<AppConfigService> = {
  get apiUrl() { return API_URL; },
};

const mockLocation: Location = {
  index: 1,
  locationName: 'Bodega Principal',
  address: 'Av. Insurgentes 1000',
  zipCode: '06600',
  state: 'Ciudad de México',
  municipality: 'Cuauhtémoc',
  neighborhood: 'Juárez',
  city: 'Ciudad de México',
  constructionType: 'MASONRY',
  level: 2,
  constructionYear: 1995,
  businessLine: { code: 'BL-001', fireKey: 'FK-INC-01', description: 'Bodega de mercancías' },
  guarantees: [
    { code: 'GUA-FIRE', insuredValue: 5000000 },
  ],
  catastrophicZone: 'ZONE_A',
  validationStatus: 'COMPLETE',
  blockingAlerts: [],
};

const mockLocationsResponse: LocationsResponse = {
  folioNumber: 'FOL-2026-00042',
  locations: [mockLocation],
  version: 4,
};

const mockSummary: LocationsSummary = {
  folioNumber: 'FOL-2026-00042',
  totalLocations: 3,
  completeLocations: 2,
  incompleteLocations: 1,
  locations: [
    {
      index: 2,
      locationName: 'Oficina Sur',
      validationStatus: 'INCOMPLETE',
      blockingAlerts: [
        { code: 'MISSING_ZIP_CODE', message: 'Código postal requerido' },
      ],
    },
  ],
};

const mockLocationResponse: LocationResponse = {
  folioNumber: 'FOL-2026-00042',
  location: { ...mockLocation, locationName: 'Bodega Actualizada' },
  updatedAt: '2026-04-22T10:00:00Z',
  version: 5,
};

describe('LocationService', () => {
  let service: LocationService;
  let httpMock: HttpTestingController;
  const folio = 'FOL-2026-00042';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    });
    service = TestBed.inject(LocationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── listar() ────────────────────────────────────────────────────────────

  it('should GET /v1/quotes/{folio}/locations and return Observable<LocationsResponse>', () => {
    // GIVEN / WHEN
    service.listar(folio).subscribe((res: LocationsResponse) => {
      // THEN
      expect(res).toEqual(mockLocationsResponse);
      expect(res.locations.length).toBe(1);
      expect(res.version).toBe(4);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations`);
    expect(req.request.method).toBe('GET');
    req.flush(mockLocationsResponse);
  });

  // ─── obtenerResumen() ────────────────────────────────────────────────────

  it('should GET /v1/quotes/{folio}/locations/summary and return Observable<LocationsSummary>', () => {
    // GIVEN / WHEN
    service.obtenerResumen(folio).subscribe((res: LocationsSummary) => {
      // THEN
      expect(res).toEqual(mockSummary);
      expect(res.totalLocations).toBe(3);
      expect(res.incompleteLocations).toBe(1);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  // ─── reemplazarLista() ───────────────────────────────────────────────────

  it('should PUT /v1/quotes/{folio}/locations with body containing locations and version', () => {
    // GIVEN
    const locations = [mockLocation];
    const version = 4;

    // WHEN
    service.reemplazarLista(folio, locations, version).subscribe((res: LocationsResponse) => {
      // THEN
      expect(res.version).toBe(5);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ locations, version });
    req.flush({ ...mockLocationsResponse, version: 5 });
  });

  // ─── actualizarParcial() — happy path ────────────────────────────────────

  it('should PATCH /v1/quotes/{folio}/locations/{index} with correct fields and version', () => {
    // GIVEN
    const index = 1;
    const patchRequest: LocationPatchRequest = {
      locationName: 'Bodega Actualizada',
      version: 4,
    };

    // WHEN
    service.actualizarParcial(folio, index, patchRequest).subscribe((res: LocationResponse) => {
      // THEN
      expect(res.location.locationName).toBe('Bodega Actualizada');
      expect(res.version).toBe(5);
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/${index}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(patchRequest);
    req.flush(mockLocationResponse);
  });

  // ─── actualizarParcial() — 409 VERSION_CONFLICT ──────────────────────────

  it('should propagate HTTP 409 VERSION_CONFLICT when actualizarParcial() receives conflict', () => {
    // GIVEN
    const index = 1;
    const patchRequest: LocationPatchRequest = { version: 3 };

    // WHEN
    service.actualizarParcial(folio, index, patchRequest).subscribe({
      next: () => fail('expected a 409 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(409);
        expect(err.error.code).toBe('VERSION_CONFLICT');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/${index}`);
    req.flush(
      { error: 'Optimistic lock conflict', code: 'VERSION_CONFLICT' },
      { status: 409, statusText: 'Conflict' }
    );
  });

  // ─── actualizarParcial() — INCOMPLETE location ───────────────────────────

  it('should PATCH and return INCOMPLETE location without filtering by validationStatus', () => {
    // GIVEN
    const index = 2;
    const patchRequest: LocationPatchRequest = { version: 4 };
    const incompleteLocation: Location = {
      ...mockLocation,
      index: 2,
      zipCode: '',
      validationStatus: 'INCOMPLETE',
      blockingAlerts: [{ code: 'MISSING_ZIP_CODE', message: 'Código postal requerido' }],
    };
    const incompleteResponse: LocationResponse = {
      folioNumber: folio,
      location: incompleteLocation,
      updatedAt: '2026-04-22T10:00:00Z',
      version: 5,
    };

    // WHEN
    service.actualizarParcial(folio, index, patchRequest).subscribe((res: LocationResponse) => {
      // THEN
      expect(res.location.validationStatus).toBe('INCOMPLETE');
      expect(res.location.blockingAlerts.length).toBeGreaterThan(0);
      expect(res.location.blockingAlerts[0].code).toBe('MISSING_ZIP_CODE');
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/${index}`);
    expect(req.request.method).toBe('PATCH');
    req.flush(incompleteResponse);
  });

  // ─── actualizarParcial() — 404 LOCATION_NOT_FOUND ────────────────────────

  it('should propagate HTTP 404 LOCATION_NOT_FOUND when actualizarParcial() receives not found', () => {
    // GIVEN
    const index = 99;
    const patchRequest: LocationPatchRequest = { version: 4 };

    // WHEN
    service.actualizarParcial(folio, index, patchRequest).subscribe({
      next: () => fail('expected a 404 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(404);
        expect(err.error.code).toBe('LOCATION_NOT_FOUND');
      },
    });

    const req = httpMock.expectOne(`${API_URL}/v1/quotes/${folio}/locations/${index}`);
    req.flush(
      { error: 'Location index not found', code: 'LOCATION_NOT_FOUND' },
      { status: 404, statusText: 'Not Found' }
    );
  });
});
