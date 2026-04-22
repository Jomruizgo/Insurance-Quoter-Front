// src/app/features/<feature>/services/<feature>.service.spec.ts
// TDD: create this file BEFORE the service implementation

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { <Feature>Service } from './<feature>.service';
import { environment } from '../../../../environments/environment';

describe('<Feature>Service', () => {
  let service: <Feature>Service;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        <Feature>Service,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(<Feature>Service);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('should return data when request succeeds', () => {
    // GIVEN
    const mockResponse: <Model> = { id: '1' } as <Model>;

    // WHEN
    service.getAll().subscribe(res => {
      // THEN
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/<resource>`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // ─── Error Path ──────────────────────────────────────────────────────────

  it('should propagate HTTP 404 error', () => {
    service.getAll().subscribe({
      error: (err) => expect(err.status).toBe(404)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/<resource>`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  it('should propagate HTTP 500 error', () => {
    service.getAll().subscribe({
      error: (err) => expect(err.status).toBe(500)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/<resource>`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });
});
