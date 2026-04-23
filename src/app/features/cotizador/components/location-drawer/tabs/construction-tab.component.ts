import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ConstructionType } from '../../../models/location.model';

interface ConstructionOption {
  value: ConstructionType;
  label: string;
}

@Component({
  selector: 'app-location-construction-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="tab-content" [formGroup]="form">
      <div class="form-field">
        <label class="form-label">Tipo constructivo</label>
        <div class="radio-cards">
          @for (option of constructionOptions; track option.value) {
            <label
              class="radio-card"
              [class.radio-card--selected]="form.get('constructionType')?.value === option.value"
            >
              <input
                type="radio"
                formControlName="constructionType"
                [value]="option.value"
                class="radio-card__input"
              />
              <span class="radio-card__label">{{ option.label }}</span>
            </label>
          }
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label class="form-label" for="level">Número de niveles</label>
          <input
            id="level"
            class="form-input"
            type="number"
            formControlName="level"
            min="1"
            max="50"
            placeholder="1–50"
          />
        </div>

        <div class="form-field">
          <label class="form-label" for="constructionYear">Año de construcción</label>
          <input
            id="constructionYear"
            class="form-input"
            type="number"
            formControlName="constructionYear"
            min="1900"
            max="2026"
            placeholder="1900–2026"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-content { padding: 1rem 0; display: flex; flex-direction: column; gap: 1.25rem; }
    .form-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }
    .radio-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.5rem;
    }
    .radio-card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: border-color 0.15s, background-color 0.15s;
    }
    .radio-card:hover { border-color: #3b82f6; background-color: #eff6ff; }
    .radio-card--selected { border-color: #3b82f6; background-color: #eff6ff; }
    .radio-card__input { margin: 0; accent-color: #3b82f6; }
    .radio-card__label { font-size: 0.875rem; color: #374151; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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
  `],
})
export class LocationConstructionTabComponent {
  @Input() form!: FormGroup;

  readonly constructionOptions: ConstructionOption[] = [
    { value: 'MASONRY', label: 'Mampostería' },
    { value: 'STEEL', label: 'Estructura metálica' },
    { value: 'CONCRETE', label: 'Concreto armado' },
    { value: 'WOOD', label: 'Madera' },
    { value: 'MIXED', label: 'Mixto' },
  ];
}
