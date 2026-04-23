import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-acceptance-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './acceptance-form.component.html',
  styleUrl: './acceptance-form.component.scss',
})
export class AcceptanceFormComponent implements OnInit {
  @Output() formChange = new EventEmitter<{ valid: boolean; acceptedBy: string }>();

  readonly form = new FormGroup({
    termsAccepted: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    truthDeclaration: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    acceptedBy: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.emitChange();
    });
  }

  ngOnInit(): void {
    this.emitChange();
  }

  private emitChange(): void {
    this.formChange.emit({
      valid: this.form.valid,
      acceptedBy: (this.form.value.acceptedBy ?? '').trim(),
    });
  }
}
