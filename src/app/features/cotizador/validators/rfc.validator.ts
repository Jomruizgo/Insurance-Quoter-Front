import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// RFC persona moral:  3 letters + 6 digits (date) + 3 alphanumeric  = 12 chars
// RFC persona fisica: 4 letters + 6 digits (date) + 3 alphanumeric  = 13 chars
export function rfcValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = (control.value ?? '').toUpperCase();
    if (!val) return null; // required validator handles empty
    const moral  = /^[A-Z&Ñ]{3}\d{6}[A-Z0-9]{3}$/;
    const fisica = /^[A-Z&Ñ]{4}\d{6}[A-Z0-9]{3}$/;
    return (moral.test(val) || fisica.test(val)) ? null : { invalidRfc: true };
  };
}
