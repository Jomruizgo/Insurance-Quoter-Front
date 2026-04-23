import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { QuoteStateService } from '../../../core/services/quote-state.service';

export const termsGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const quoteStateService = inject(QuoteStateService);
  const router = inject(Router);

  const folio: string = route.params['folioNumber'];

  return quoteStateService.obtenerEstado(folio).pipe(
    map((state) => {
      if (state.quoteStatus === 'CALCULATED') {
        return true;
      }
      return router.createUrlTree(['/cotizador', 'quotes', folio, 'calculation']);
    })
  );
};
