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
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
    }
    .form-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      outline: none;
      box-sizing: border-box;
    }
    .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    .confirmation-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .confirmation-card__header {
      background-color: #f3f4f6;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
    }
    .confirmation-card__body { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; }
    .detail-label { font-size: 0.8125rem; color: #6b7280; }
    .detail-value { font-size: 0.875rem; color: #111827; font-weight: 500; }
    .detail-value--highlight { color: #1d4ed8; font-weight: 700; }
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
