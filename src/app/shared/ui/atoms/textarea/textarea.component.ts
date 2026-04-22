import { Component, ChangeDetectorRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [],
  template: `
    <textarea
      class="textarea"
      [value]="value"
      [disabled]="disabled"
      (input)="onInput($event)"
      (blur)="onTouched()"
    ></textarea>
  `,
  styleUrl: './textarea.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextareaComponent), multi: true }]
})
export class TextareaComponent implements ControlValueAccessor {
  protected value: string = '';
  protected disabled: boolean = false;

  private readonly cdr = inject(ChangeDetectorRef);
  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value = val ?? '';
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: string) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.cdr.markForCheck();
  }

  onInput(e: Event): void {
    const val = (e.target as HTMLTextAreaElement).value;
    this.value = val;
    this._onChange(val);
  }

  onTouched(): void { this._onTouched(); }
}
