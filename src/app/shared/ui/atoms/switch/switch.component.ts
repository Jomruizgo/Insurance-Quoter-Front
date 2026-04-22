import { Component, Input, Output, EventEmitter, ChangeDetectorRef, HostListener, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SwitchComponent), multi: true }]
})
export class SwitchComponent implements ControlValueAccessor {
  private _on: boolean = false;
  private _cvaActive: boolean = false;

  get on(): boolean { return this._on; }

  // @Input() is ignored once a FormControl is attached (CVA takes over).
  @Input() set on(value: boolean) {
    if (!this._cvaActive) this._on = value;
  }

  @Output() change = new EventEmitter<boolean>();

  protected disabled: boolean = false;

  private readonly cdr = inject(ChangeDetectorRef);
  private _onChange: (v: boolean) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: boolean): void {
    this._cvaActive = true;
    this._on = !!val;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: boolean) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.cdr.markForCheck();
  }

  toggle(): void {
    if (this.disabled) return;
    this._on = !this._on;
    this._onChange(this._on);
    this.change.emit(this._on);
    this._onTouched();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggle();
    }
  }
}
