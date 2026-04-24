import { Component, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <select
      #selectEl
      class="select"
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
export class SelectComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('selectEl') private selectEl!: ElementRef<HTMLSelectElement>;

  protected value: string = '';
  protected disabled: boolean = false;

  private readonly cdr = inject(ChangeDetectorRef);
  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    if (this.value && this.selectEl) {
      this.selectEl.nativeElement.value = this.value;
    }
  }

  writeValue(val: string): void {
    this.value = val ?? '';
    if (this.selectEl) {
      this.selectEl.nativeElement.value = this.value;
      // If option not yet rendered (dynamic @for list), retry after CD cycle
      if (this.selectEl.nativeElement.value !== this.value) {
        setTimeout(() => {
          if (this.selectEl) {
            this.selectEl.nativeElement.value = this.value;
            this.cdr.markForCheck();
          }
        });
      }
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: string) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.cdr.markForCheck();
  }

  onSelect(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.value = val;
    this._onChange(val);
  }

  onTouched(): void { this._onTouched(); }
}
