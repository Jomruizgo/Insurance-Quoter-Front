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
      border: 1px solid var(--border);
      border-radius: var(--r-md);
    }
    .guarantee-check input { accent-color: var(--brand-500); width: 1rem; height: 1rem; cursor: pointer; }
    .guarantee-label {
      flex: 1;
      font-size: var(--fs-14);
      color: var(--text-dim);
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }
    .guarantee-code { font-size: var(--fs-12); color: var(--text-mute); }
    .guarantee-amount {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .amount-prefix { font-size: var(--fs-14); color: var(--text-dim); }
    .amount-input {
      width: 8rem;
      padding: 0.375rem 0.5rem;
      border: 1px solid var(--border-strong);
      border-radius: var(--r-sm);
      font-size: var(--fs-14);
      text-align: right;
      background: var(--surface);
      color: var(--text);
      font-family: inherit;
    }
    .amount-input:focus { outline: none; border-color: var(--brand-500); }
    .amount-input--disabled { background-color: var(--surface-2); color: var(--text-mute); }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      margin-top: 0.75rem;
      background-color: var(--surface-2);
      border-radius: var(--r-md);
      border: 1px solid var(--border);
    }
    .total-label { font-size: var(--fs-14); font-weight: 600; color: var(--text-dim); }
    .total-value { font-size: var(--fs-16); font-weight: 700; color: var(--text); }
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
