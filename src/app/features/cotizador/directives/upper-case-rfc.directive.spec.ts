// TDD: spec for UpperCaseRfcDirective — verifies that input event stores uppercase value in control
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UpperCaseRfcDirective } from './upper-case-rfc.directive';

describe('UpperCaseRfcDirective', () => {

  it('should convert lowercase input value to uppercase in the FormControl', () => {
    // GIVEN — a directive instance with a mocked NgControl
    const control = new FormControl('');
    const mockNgControl = { control };

    // Instantiate directive directly (no need for TestBed component fixture)
    const directive = new UpperCaseRfcDirective(mockNgControl as never);

    // Create a mock InputEvent targeting an input element
    const inputEl = document.createElement('input');
    inputEl.value = 'xaxx010101000';
    const event = new Event('input', { bubbles: true });
    Object.defineProperty(event, 'target', { value: inputEl });

    // WHEN — the input event fires
    directive.onInput(event);

    // THEN — the form control value is uppercase
    expect(control.value).toBe('XAXX010101000');
  });

  it('should keep uppercase value unchanged when input is already uppercase', () => {
    // GIVEN
    const control = new FormControl('');
    const mockNgControl = { control };
    const directive = new UpperCaseRfcDirective(mockNgControl as never);

    const inputEl = document.createElement('input');
    inputEl.value = 'EEJ900101ABC';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: inputEl });

    // WHEN
    directive.onInput(event);

    // THEN
    expect(control.value).toBe('EEJ900101ABC');
  });
});
