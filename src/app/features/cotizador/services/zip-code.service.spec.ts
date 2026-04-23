// TDD RED: this file is created BEFORE the service implementation
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ZipCodeService } from './zip-code.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { ZipCodeInfo } from '../models/zip-code.model';

const CORE_URL = 'http://localhost:8081';

const mockAppConfigService: Partial<AppConfigService> = {
  get coreUrl() { return CORE_URL; },
};

const mockZipCodeInfo: ZipCodeInfo = {
  zipCode: '06600',
  state: 'Ciudad de México',
  municipality: 'Cuauhtémoc',
  city: 'Ciudad de México',
  neighborhoods: ['Juárez', 'Tabacalera'],
  catastrophicZone: 'ZONE_A',
  tevZone: 'TEV-1',
  fhmZone: 'FHM-2',
  valid: true,
};

describe('ZipCodeService', () => {
  let service: ZipCodeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ZipCodeService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: mockAppConfigService },
      ],
    });
    service = TestBed.inject(ZipCodeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── buscar() — happy path ────────────────────────────────────────────────

  it('should GET /v1/zip-codes/{zipCode} and return ZipCodeInfo for valid zip code', () => {
    // GIVEN
    const zipCode = '06600';

    // WHEN
    service.buscar(zipCode).subscribe((res: ZipCodeInfo) => {
      // THEN
      expect(res).toEqual(mockZipCodeInfo);
      expect(res.state).toBe('Ciudad de México');
      expect(res.neighborhoods.length).toBe(2);
    });

    const req = httpMock.expectOne(`${CORE_URL}/v1/zip-codes/${zipCode}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockZipCodeInfo);
  });

  // ─── buscar() — 404 ZIP_CODE_NOT_FOUND ───────────────────────────────────

  it('should propagate HTTP 404 ZIP_CODE_NOT_FOUND when zip code does not exist', () => {
    // GIVEN
    const zipCode = '99999';

    // WHEN
    service.buscar(zipCode).subscribe({
      next: () => fail('expected a 404 error'),
      // THEN
      error: (err: { status: number; error: { code: string } }) => {
        expect(err.status).toBe(404);
        expect(err.error.code).toBe('ZIP_CODE_NOT_FOUND');
      },
    });

    const req = httpMock.expectOne(`${CORE_URL}/v1/zip-codes/${zipCode}`);
    req.flush(
      { error: 'Zip code not found', code: 'ZIP_CODE_NOT_FOUND' },
      { status: 404, statusText: 'Not Found' }
    );
  });

  // ─── buscar() — network error ─────────────────────────────────────────────

  it('should propagate network errors when buscar() fails due to connection issue', () => {
    // GIVEN
    const zipCode = '06600';
    let errorReceived = false;

    // WHEN
    service.buscar(zipCode).subscribe({
      next: () => fail('expected a network error'),
      // THEN
      error: () => { errorReceived = true; },
    });

    const req = httpMock.expectOne(`${CORE_URL}/v1/zip-codes/${zipCode}`);
    req.error(new ProgressEvent('network error'));

    expect(errorReceived).toBeTrue();
  });
});
