import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type Theme = 'light' | 'dark';
type PrimaryColor = 'green' | 'lime' | 'teal' | 'indigo' | 'amber';
type Density = 'compact' | 'standard' | 'cozy';

interface ColorOption {
  value: PrimaryColor;
  label: string;
  swatch: string;
}

interface DensityOption {
  value: Density;
  label: string;
}

const STORAGE_KEY = 'sofka-iq-tweaks';

@Component({
  selector: 'app-tweaks-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tweaks">
      <button
        class="tweaks__trigger"
        type="button"
        (click)="toggleOpen()"
        [attr.aria-expanded]="open"
        aria-label="Personalizar apariencia"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
        </svg>
        Tweaks
      </button>

      @if (open) {
        <div class="tweaks__panel" role="dialog" aria-label="Panel de personalización">
          <div class="tweaks__header">
            <span class="tweaks__title">Tweaks</span>
            <button class="tweaks__close" type="button" (click)="open = false" aria-label="Cerrar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Theme -->
          <div class="tweaks__section">
            <p class="tweaks__label">Modo</p>
            <div class="tweaks__toggle-row">
              <button
                class="tweaks__mode-btn"
                [class.tweaks__mode-btn--active]="theme === 'light'"
                type="button"
                (click)="setTheme('light')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/>
                  <path stroke-linecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                Claro
              </button>
              <button
                class="tweaks__mode-btn"
                [class.tweaks__mode-btn--active]="theme === 'dark'"
                type="button"
                (click)="setTheme('dark')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path stroke-linecap="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Oscuro
              </button>
            </div>
          </div>

          <!-- Primary color -->
          <div class="tweaks__section">
            <p class="tweaks__label">Color principal</p>
            <div class="tweaks__colors">
              @for (opt of colorOptions; track opt.value) {
                <button
                  class="tweaks__color-btn"
                  [class.tweaks__color-btn--active]="primaryColor === opt.value"
                  [style.background]="opt.swatch"
                  [title]="opt.label"
                  type="button"
                  (click)="setPrimaryColor(opt.value)"
                  [attr.aria-label]="opt.label + (primaryColor === opt.value ? ' (activo)' : '')"
                >
                  @if (primaryColor === opt.value) {
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Density -->
          <div class="tweaks__section">
            <p class="tweaks__label">Densidad</p>
            <div class="tweaks__density">
              @for (opt of densityOptions; track opt.value) {
                <button
                  class="tweaks__density-btn"
                  [class.tweaks__density-btn--active]="density === opt.value"
                  type="button"
                  (click)="setDensity(opt.value)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <div class="tweaks__footer">
            <button class="tweaks__reset" type="button" (click)="reset()">
              Restablecer
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tweaks {
      position: relative;
    }

    .tweaks__trigger {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 30px;
      padding: 0 10px;
      border-radius: var(--r-md);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      cursor: pointer;
      color: var(--text-dim);
      font-size: var(--fs-13);
      font-weight: 500;
      font-family: inherit;
      transition: background var(--t-fast) var(--ease), color var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease);
    }
    .tweaks__trigger:hover {
      background: var(--surface-2);
      border-color: var(--ink-300);
      color: var(--text);
    }

    .tweaks__panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 240px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      box-shadow: var(--sh-pop);
      z-index: 200;
      overflow: hidden;
    }

    .tweaks__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px 10px;
      border-bottom: 1px solid var(--border);
    }
    .tweaks__title {
      font-size: var(--fs-13);
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.01em;
    }
    .tweaks__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: var(--r-sm);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-mute);
    }
    .tweaks__close:hover { background: var(--surface-2); color: var(--text); }

    .tweaks__section {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
    }
    .tweaks__label {
      margin: 0 0 8px;
      font-size: var(--fs-11);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-mute);
    }

    /* Mode toggle */
    .tweaks__toggle-row {
      display: flex;
      gap: 6px;
    }
    .tweaks__mode-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 30px;
      padding: 0 10px;
      border-radius: var(--r-md);
      font-size: var(--fs-12);
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid var(--border-strong);
      background: var(--surface-2);
      color: var(--text-dim);
      transition: all var(--t-fast) var(--ease);
    }
    .tweaks__mode-btn:hover { background: var(--surface); color: var(--text); }
    .tweaks__mode-btn--active {
      background: var(--brand-500);
      border-color: var(--brand-500);
      color: var(--ink-900);
    }

    /* Color swatches */
    .tweaks__colors {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tweaks__color-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
    }
    .tweaks__color-btn:hover { transform: scale(1.1); box-shadow: var(--sh-2); }
    .tweaks__color-btn--active {
      box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px currentColor;
    }

    /* Density */
    .tweaks__density {
      display: flex;
      gap: 4px;
    }
    .tweaks__density-btn {
      flex: 1;
      height: 28px;
      border-radius: var(--r-md);
      font-size: var(--fs-12);
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid var(--border-strong);
      background: var(--surface-2);
      color: var(--text-dim);
      transition: all var(--t-fast) var(--ease);
    }
    .tweaks__density-btn:hover { background: var(--surface); color: var(--text); }
    .tweaks__density-btn--active {
      background: var(--brand-500);
      border-color: var(--brand-500);
      color: var(--ink-900);
    }

    /* Footer */
    .tweaks__footer {
      padding: 10px 14px;
      display: flex;
      justify-content: flex-end;
    }
    .tweaks__reset {
      font-size: var(--fs-12);
      color: var(--text-mute);
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: inherit;
      padding: 2px 4px;
      border-radius: var(--r-xs);
    }
    .tweaks__reset:hover { color: var(--text-dim); background: var(--surface-2); }
  `],
})
export class TweaksPanelComponent implements OnInit {
  open = false;
  theme: Theme = 'light';
  primaryColor: PrimaryColor = 'green';
  density: Density = 'standard';

  readonly colorOptions: ColorOption[] = [
    { value: 'green',  label: 'Verde',  swatch: 'oklch(0.72 0.25 142)' },
    { value: 'lime',   label: 'Lima',   swatch: 'oklch(0.82 0.22 135)' },
    { value: 'teal',   label: 'Teal',   swatch: 'oklch(0.70 0.14 190)' },
    { value: 'indigo', label: 'Indigo', swatch: 'oklch(0.60 0.19 270)' },
    { value: 'amber',  label: 'Ámbar',  swatch: 'oklch(0.80 0.17 75)'  },
  ];

  readonly densityOptions: DensityOption[] = [
    { value: 'compact',  label: 'Compacto' },
    { value: 'standard', label: 'Normal' },
    { value: 'cozy',     label: 'Amplio' },
  ];

  ngOnInit(): void {
    this.loadFromStorage();
    this.applyAll();
  }

  toggleOpen(): void {
    this.open = !this.open;
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.applyAll();
    this.saveToStorage();
  }

  setPrimaryColor(color: PrimaryColor): void {
    this.primaryColor = color;
    this.applyAll();
    this.saveToStorage();
  }

  setDensity(density: Density): void {
    this.density = density;
    this.applyAll();
    this.saveToStorage();
  }

  reset(): void {
    this.theme = 'light';
    this.primaryColor = 'green';
    this.density = 'standard';
    this.applyAll();
    localStorage.removeItem(STORAGE_KEY);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.open && !target.closest('app-tweaks-panel')) {
      this.open = false;
    }
  }

  private applyAll(): void {
    const html = document.documentElement;

    if (this.theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }

    if (this.primaryColor === 'green') {
      html.removeAttribute('data-primary');
    } else {
      html.setAttribute('data-primary', this.primaryColor);
    }

    if (this.density === 'standard') {
      html.removeAttribute('data-density');
    } else {
      html.setAttribute('data-density', this.density);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: this.theme,
      primaryColor: this.primaryColor,
      density: this.density,
    }));
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (prefs.theme) this.theme = prefs.theme;
      if (prefs.primaryColor) this.primaryColor = prefs.primaryColor;
      if (prefs.density) this.density = prefs.density;
    } catch {
      // ignore malformed storage
    }
  }
}
