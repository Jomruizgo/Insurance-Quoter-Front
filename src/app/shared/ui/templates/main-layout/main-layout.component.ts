import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, switchMap, startWith, catchError } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';
import { StepperComponent } from '../../organisms/stepper/stepper.component';
import { StatusBarComponent } from '../../organisms/status-bar/status-bar.component';
import { QuoteStateService } from '../../../../core/services/quote-state.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, StepperComponent, StatusBarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly quoteStateService = inject(QuoteStateService);

  readonly activeFolio = toSignal(
    this.route.paramMap.pipe(map(p => p.get('folioNumber'))),
    { initialValue: null as string | null }
  );

  readonly isFolioRoute = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url.includes('/quotes/')),
      startWith(this.router.url.includes('/quotes/'))
    ),
    { initialValue: false }
  );

  readonly quoteState = toSignal(
    combineLatest([
      this.route.paramMap.pipe(map(p => p.get('folioNumber'))),
      this.quoteStateService.refresh$.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([folio]) =>
        folio
          ? this.quoteStateService.obtenerEstado(folio).pipe(catchError(() => of(null)))
          : of(null)
      ),
      startWith(null)
    ),
    { initialValue: null }
  );

  readonly activeRoute = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url.split('/').pop() ?? ''),
      startWith(this.router.url.split('/').pop() ?? '')
    ),
    { initialValue: '' }
  );
}
