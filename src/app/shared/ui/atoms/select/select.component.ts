import { Component, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <select
      class="select"
      [value]="value"
      [disabled]="disabled"
      (change)="onSelect($event)"
      (blur)="onTouched()"
    >
      <ng-content />
    </select>
  `,
  styleUrl: './select.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }]
})
export class SelectComponent implements ControlValueAccessor {
  value: string = '';
  disabled: boolean = false;
  onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string): void { this.value = val ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }

  onSelect(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.value = val;
    this.onChange(val);
  }
}
