import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray, AbstractControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

interface GuaranteeConfig {
  code: string;
  label: string;
}

@Component({
  selector: 'app-location-guarantees-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="tab-content" [formGroup]="form">
      <div class="guarantees-list" formArrayName="guarantees">
        @for (item of guaranteeConfigs; track item.code; let i = $index) {
          <div class="guarantee-row" [formGroupName]="i">
            <div class="guarantee-check">
              <input
                type="checkbox"
                [id]="'g-' + item.code"
                formControlName="active"
                (change)="onActiveChange(i)"
              />
            </div>
            <label class="guarantee-label" [for]="'g-' + item.code">
              {{ item.label }}
              <span class="guarantee-code">{{ item.code }}</span>
            </label>
            <div class="guarantee-amount">
              <span class="amount-prefix">$</span>
              <input
                type="number"
                class="amount-input"
                formControlName="insuredValue"
                [class.amount-input--disabled]="!guaranteesArray.at(i).get('active')?.value"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        }
      </div>

      <div class="total-row">
        <span class="total-label">Total suma asegurada</span>
        <span class="total-value">{{ grandTotal | currency:'MXN':'symbol-narrow':'1.0-0' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .tab-content { padding: 1rem 0; }
    .guarantees-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .guarantee-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
    }
    .guarantee-check input { accent-color: #3b82f6; width: 1rem; height: 1rem; cursor: pointer; }
    .guarantee-label {
      flex: 1;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }
    .guarantee-code { font-size: 0.75rem; color: #9ca3af; }
    .guarantee-amount {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .amount-prefix { font-size: 0.875rem; color: #6b7280; }
    .amount-input {
      width: 8rem;
      padding: 0.375rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      text-align: right;
    }
    .amount-input:focus { outline: none; border-color: #3b82f6; }
    .amount-input--disabled { background-color: #f9fafb; color: #9ca3af; }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      margin-top: 0.75rem;
      background-color: #f9fafb;
      border-radius: 0.375rem;
      border: 1px solid #e5e7eb;
    }
    .total-label { font-size: 0.875rem; font-weight: 600; color: #374151; }
    .total-value { font-size: 1rem; font-weight: 700; color: #111827; }
  `],
})
export class LocationGuaranteesTabComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;

  private readonly destroy$ = new Subject<void>();

  readonly guaranteeConfigs: GuaranteeConfig[] = [
    { code: 'GUA-FIRE', label: 'Incendio edificios' },
    { code: 'GUA-CONT', label: 'Incendio contenidos' },
    { code: 'GUA-THEFT', label: 'Robo con violencia' },
    { code: 'GUA-GLASS', label: 'Vidrios' },
    { code: 'GUA-ELEC', label: 'Equipo electrónico' },
    { code: 'GUA-CASH', label: 'Dinero y valores' },
  ];

  get guaranteesArray(): FormArray {
    return this.form.get('guarantees') as FormArray;
  }

  get grandTotal(): number {
    return this.guaranteesArray.controls.reduce((sum, ctrl: AbstractControl) => {
      const active = ctrl.get('active')?.value;
      const value = ctrl.get('insuredValue')?.value ?? 0;
      return sum + (active ? Number(value) : 0);
    }, 0);
  }

  ngOnInit(): void {
    this.guaranteesArray.controls.forEach((ctrl, i) => {
      ctrl.get('active')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((active: boolean) => {
          const valueCtrl = ctrl.get('insuredValue');
          if (!active) {
            valueCtrl?.setValue(0, { emitEvent: false });
            valueCtrl?.disable({ emitEvent: false });
          } else {
            valueCtrl?.enable({ emitEvent: false });
          }
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onActiveChange(index: number): void {
    const ctrl = this.guaranteesArray.at(index);
    const active = ctrl.get('active')?.value;
    const valueCtrl = ctrl.get('insuredValue');
    if (!active) {
      valueCtrl?.setValue(0, { emitEvent: false });
      valueCtrl?.disable({ emitEvent: false });
    } else {
      valueCtrl?.enable({ emitEvent: false });
    }
  }
}
