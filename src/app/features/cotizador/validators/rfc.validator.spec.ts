// TDD RED: this file is created BEFORE the validator implementation
import { FormControl } from '@angular/forms';
import { rfcValidator } from './rfc.validator';

describe('rfcValidator', () => {
  const validate = (value: string) => rfcValidator()(new FormControl(value));

  // ─── Happy Path ──────────────────────────────────────────────────────────

  it('should return null for a valid RFC persona moral (12 chars)', () => {
    // GIVEN a valid 12-char moral RFC
    // WHEN validated
    const result = validate('AAA900101AAA');
    // THEN no error
    expect(result).toBeNull();
  });

  it('should return null for a valid RFC persona fisica (13 chars)', () => {
    // GIVEN a valid 13-char fisica RFC
    // WHEN validated
    const result = validate('AAAA900101AAA');
    // THEN no error
    expect(result).toBeNull();
  });

  // ─── Error Path ──────────────────────────────────────────────────────────

  it('should return { invalidRfc: true } for a short RFC (less than 12 chars)', () => {
    // GIVEN an invalid short RFC
    // WHEN validated
    const result = validate('ABC123');
    // THEN error is returned
    expect(result).toEqual({ invalidRfc: true });
  });

  it('should return { invalidRfc: true } for a long RFC (more than 13 chars)', () => {
    // GIVEN an invalid long RFC
    // WHEN validated
    const result = validate('AAAAA900101AAAA');
    // THEN error is returned
    expect(result).toEqual({ invalidRfc: true });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────────

  it('should return null for an empty control (required handles empty validation)', () => {
    // GIVEN an empty control
    // WHEN validated
    const result = validate('');
    // THEN no error — required validator is responsible for empty check
    expect(result).toBeNull();
  });

  it('should return null for a lowercase RFC that normalizes to valid (persona moral)', () => {
    // GIVEN a lowercase valid moral RFC
    // WHEN validated (function normalizes to uppercase before validating)
    const result = validate('aaa900101aaa');
    // THEN no error — lowercase is normalized internally
    expect(result).toBeNull();
  });
});
