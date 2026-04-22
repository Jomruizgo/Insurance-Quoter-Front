import { Component, Input, Output, EventEmitter, HostListener, forwardRef } from '@angular/core';
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
  @Input() on: boolean = false;
  @Output() change = new EventEmitter<boolean>();

  disabled: boolean = false;
  onChange: (v: boolean) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: boolean): void { this.on = !!val; }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }

  toggle(): void {
    if (this.disabled) return;
    this.on = !this.on;
    this.onChange(this.on);
    this.change.emit(this.on);
    this.onTouched();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggle();
    }
  }
}
