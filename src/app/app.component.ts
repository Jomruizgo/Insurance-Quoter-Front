import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { AppHeaderComponent } from './shared/ui/organisms/app-header/app-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);

  readonly activeFolio = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.extractFolioFromUrl()),
      startWith(this.extractFolioFromUrl())
    ),
    { initialValue: null as string | null }
  );

  private extractFolioFromUrl(): string | null {
    const segments = this.router.url.split('/');
    const idx = segments.indexOf('quotes');
    return idx !== -1 ? segments[idx + 1] : null;
  }
}
