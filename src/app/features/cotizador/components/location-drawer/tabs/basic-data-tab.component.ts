import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-location-basic-data-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="tab-content" [formGroup]="form">
      <div class="form-grid">
        <div class="form-field form-field--full">
          <label class="form-label" for="locationName">Nombre de ubicación</label>
          <input
            id="locationName"
            class="form-input"
            type="text"
            formControlName="locationName"
            placeholder="Ej: Bodega Principal"
            maxlength="200"
          />
        </div>

        <div class="form-field form-field--full">
          <label class="form-label" for="address">Dirección</label>
          <input
            id="address"
            class="form-input"
            type="text"
            formControlName="address"
            placeholder="Calle, número, colonia"
            maxlength="500"
          />
        </div>

        <div class="form-field">
          <label class="form-label" for="zipCode">Código Postal</label>
          <input
            id="zipCode"
            class="form-input"
            type="text"
            formControlName="zipCode"
            placeholder="00000"
            maxlength="5"
          />
        </div>

        <div class="form-field">
          <label class="form-label" for="neighborhood">Colonia</label>
          <select id="neighborhood" class="form-input" formControlName="neighborhood">
            <option value="">Seleccionar colonia</option>
            @for (n of neighborhoods; track n) {
              <option [value]="n">{{ n }}</option>
            }
          </select>
        </div>

        <div class="form-field">
          <label class="form-label" for="state">Estado</label>
          <input
            id="state"
            class="form-input form-input--readonly"
            type="text"
            formControlName="state"
            readonly
            placeholder="Auto-relleno"
          />
        </div>

        <div class="form-field">
          <label class="form-label" for="municipality">Municipio</label>
          <input
            id="municipality"
            class="form-input form-input--readonly"
            type="text"
            formControlName="municipality"
            readonly
            placeholder="Auto-relleno"
          />
        </div>

        <div class="form-field">
          <label class="form-label" for="city">Ciudad</label>
          <input
            id="city"
            class="form-input form-input--readonly"
            type="text"
            formControlName="city"
            readonly
            placeholder="Auto-relleno"
          />
        </div>
      </div>

      @if (catastrophicInfo) {
        <div class="catastrophic-badge">
          <span class="badge-label">Zona catastrófica:</span>
          <span class="badge-value">{{ catastrophicInfo.tevZone }} · {{ catastrophicInfo.fhmZone }} · {{ catastrophicInfo.catastrophicZone }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .tab-content { padding: 1rem 0; }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-field--full { grid-column: 1 / -1; }
    .form-label {
      display: block;
      font-size: var(--fs-13);
      font-weight: 500;
      color: var(--text-dim);
      margin-bottom: 0.25rem;
    }
    .form-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-strong);
      border-radius: var(--r-md);
      font-size: var(--fs-14);
      outline: none;
      box-sizing: border-box;
      background: var(--surface);
      color: var(--text);
      font-family: inherit;
    }
    .form-input:focus { border-color: var(--brand-500); box-shadow: 0 0 0 3px color-mix(in oklch, var(--brand-500) 20%, transparent); }
    .form-input--readonly { background-color: var(--surface-2); color: var(--text-dim); }
    .catastrophic-badge {
      margin-top: 1rem;
      padding: 0.5rem 0.75rem;
      background-color: color-mix(in oklch, var(--info) 10%, transparent);
      border: 1px solid color-mix(in oklch, var(--info) 30%, transparent);
      border-radius: var(--r-md);
      font-size: var(--fs-13);
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .badge-label { color: var(--info); font-weight: 600; }
    .badge-value { color: var(--info); }
  `],
})
export class LocationBasicDataTabComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() neighborhoods: string[] = [];
  @Input() catastrophicInfo?: { tevZone: string; fhmZone: string; catastrophicZone: string };
  @Output() zipCodeChanged = new EventEmitter<string>();

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.form.get('zipCode')?.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        filter((v: string) => v?.length === 5 && /^\d{5}$/.test(v)),
        takeUntil(this.destroy$)
      )
      .subscribe((v: string) => this.zipCodeChanged.emit(v));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
