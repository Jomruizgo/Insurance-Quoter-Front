// TDD RED: this file is created BEFORE the guard implementation
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { termsGuard } from './terms.guard';
import { QuoteStateService } from '../../../core/services/quote-state.service';
import { QuoteState } from '../../../core/models/folio.model';

const mockQuoteState = (quoteStatus: string): QuoteState => ({
  folioNumber: 'FOL-001',
  quoteStatus: quoteStatus as QuoteState['quoteStatus'],
  completionPercentage: 100,
  sections: {
    generalInfo: 'COMPLETE',
    layout: 'COMPLETE',
    locations: 'COMPLETE',
    coverageOptions: 'COMPLETE',
    calculation: 'COMPLETE',
  },
  version: 8,
  updatedAt: '2026-04-23T16:00:00Z',
});

describe('termsGuard', () => {
  let router: Router;
  let quoteStateService: jasmine.SpyObj<QuoteStateService>;
  const folio = 'FOL-001';

  const buildRoute = (folioNumber: string): ActivatedRouteSnapshot => {
    const route = new ActivatedRouteSnapshot();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (route as any).params = { folioNumber };
    return route;
  };

  beforeEach(() => {
    const quoteStateSpy = jasmine.createSpyObj('QuoteStateService', ['obtenerEstado']);

    TestBed.configureTestingModule({
      providers: [
        { provide: QuoteStateService, useValue: quoteStateSpy },
      ],
    });

    router = TestBed.inject(Router);
    quoteStateService = TestBed.inject(QuoteStateService) as jasmine.SpyObj<QuoteStateService>;
  });

  const runGuard = (route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> => {
    return TestBed.runInInjectionContext(() => {
      const result = termsGuard(route, {} as RouterStateSnapshot);
      if (result instanceof Observable) {
        return result.toPromise() as Promise<boolean | UrlTree>;
      }
      return Promise.resolve(result as boolean | UrlTree);
    });
  };

  // ─── allow access when quoteStatus is CALCULATED ─────────────────────────

  it('should allow access when quoteStatus is CALCULATED', async () => {
    // GIVEN
    quoteStateService.obtenerEstado.and.returnValue(of(mockQuoteState('CALCULATED')));
    const route = buildRoute(folio);

    // WHEN
    const result = await runGuard(route);

    // THEN
    expect(result).toBe(true);
  });

  // ─── redirect to calculation when quoteStatus is IN_PROGRESS ─────────────

  it('should redirect to /cotizador/quotes/FOL-001/calculation when quoteStatus is IN_PROGRESS', async () => {
    // GIVEN
    quoteStateService.obtenerEstado.and.returnValue(of(mockQuoteState('IN_PROGRESS')));
    const route = buildRoute(folio);

    // WHEN
    const result = await runGuard(route);

    // THEN
    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(router.serializeUrl(urlTree)).toBe(`/cotizador/quotes/${folio}/calculation`);
  });

  // ─── redirect to calculation when quoteStatus is CREATED ─────────────────

  it('should redirect to /cotizador/quotes/FOL-001/calculation when quoteStatus is CREATED', async () => {
    // GIVEN
    quoteStateService.obtenerEstado.and.returnValue(of(mockQuoteState('CREATED')));
    const route = buildRoute(folio);

    // WHEN
    const result = await runGuard(route);

    // THEN
    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(router.serializeUrl(urlTree)).toBe(`/cotizador/quotes/${folio}/calculation`);
  });

  // ─── redirect to calculation when quoteStatus is ISSUED ──────────────────

  it('should redirect to /cotizador/quotes/FOL-001/calculation when quoteStatus is ISSUED', async () => {
    // GIVEN
    quoteStateService.obtenerEstado.and.returnValue(of(mockQuoteState('ISSUED')));
    const route = buildRoute(folio);

    // WHEN
    const result = await runGuard(route);

    // THEN
    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(router.serializeUrl(urlTree)).toBe(`/cotizador/quotes/${folio}/calculation`);
  });

  // ─── redirect to calculation when obtenerEstado() throws network error ────

  it('should redirect to /cotizador/quotes/FOL-001/calculation when obtenerEstado() throws', async () => {
    // GIVEN
    const { throwError } = await import('rxjs');
    quoteStateService.obtenerEstado.and.returnValue(throwError(() => new Error('Network error')));
    const route = buildRoute(folio);

    // WHEN
    const result = await runGuard(route);

    // THEN
    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(router.serializeUrl(urlTree)).toBe(`/cotizador/quotes/${folio}/calculation`);
  });
});
