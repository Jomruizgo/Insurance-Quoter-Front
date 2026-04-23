import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { BusinessLine } from '../../../models/catalog.model';

@Component({
  selector: 'app-location-business-line-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="tab-content" [formGroup]="form">
      <div class="form-field">
        <label class="form-label" for="businessLineCode">Giro de negocio</label>
        <select id="businessLineCode" class="form-input" formControlName="businessLineCode">
          <option value="">Seleccionar giro</option>
          @for (bl of businessLines; track bl.code) {
            <option [value]="bl.code">{{ bl.code }} — {{ bl.description }}</option>
          }
        </select>
      </div>

      @if (selectedBusinessLine) {
        <div class="confirmation-card">
          <div class="confirmation-card__header">Giro seleccionado</div>
          <div class="confirmation-card__body">
            <div class="detail-row">
              <span class="detail-label">Código</span>
              <span class="detail-value">{{ selectedBusinessLine.code }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Descripción</span>
              <span class="detail-value">{{ selectedBusinessLine.description }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Clave incendio</span>
              <span class="detail-value detail-value--highlight">{{ selectedBusinessLine.fireKey }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tab-content { padding: 1rem 0; display: flex; flex-direction: column; gap: 1.25rem; }
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
    .confirmation-card {
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      overflow: hidden;
    }
    .confirmation-card__header {
      background-color: var(--surface-2);
      padding: 0.5rem 0.75rem;
      font-size: var(--fs-13);
      font-weight: 600;
      color: var(--text-dim);
    }
    .confirmation-card__body { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; }
    .detail-label { font-size: var(--fs-13); color: var(--text-dim); }
    .detail-value { font-size: var(--fs-14); color: var(--text); font-weight: 500; }
    .detail-value--highlight { color: var(--brand-600); font-weight: 700; }
  `],
})
export class LocationBusinessLineTabComponent {
  @Input() form!: FormGroup;
  @Input() businessLines: BusinessLine[] = [];

  get selectedBusinessLine(): BusinessLine | undefined {
    const code = this.form.get('businessLineCode')?.value;
    return code ? this.businessLines.find(bl => bl.code === code) : undefined;
  }
}
