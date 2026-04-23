import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

/** Converts RFC field input to uppercase in real time via the bound FormControl. */
@Directive({
  selector: '[appUpperCaseRfc]',
  standalone: true,
})
export class UpperCaseRfcDirective {
  constructor(private readonly ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    input.value = upper;
    this.ngControl.control?.setValue(upper, { emitEvent: true });
  }
}
