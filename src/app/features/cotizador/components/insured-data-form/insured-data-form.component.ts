import { Component, Input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FieldComponent } from '../../../../shared/ui/atoms/field/field.component';
import { InputComponent } from '../../../../shared/ui/atoms/input/input.component';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge.component';
import { SectionHeaderComponent } from '../../../../shared/ui/atoms/section-header/section-header.component';
import { UpperCaseRfcDirective } from '../../directives/upper-case-rfc.directive';

@Component({
  selector: 'app-insured-data-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FieldComponent,
    InputComponent,
    BadgeComponent,
    SectionHeaderComponent,
    UpperCaseRfcDirective,
  ],
  templateUrl: './insured-data-form.component.html',
  styleUrl: './insured-data-form.component.scss',
})
export class InsuredDataFormComponent {
  @Input() form!: FormGroup;
  @Input() isComplete = false;

  get nameError(): string | undefined {
    const c = this.form.get('name');
    if (c?.touched && c.hasError('required')) return 'Campo obligatorio';
    return undefined;
  }

  get rfcError(): string | undefined {
    const c = this.form.get('rfc');
    if (c?.touched && c.hasError('required')) return 'Campo obligatorio';
    if (c?.touched && c.hasError('invalidRfc')) return 'RFC inválido — debe tener entre 12 y 13 caracteres alfanuméricos';
    return undefined;
  }

  get emailError(): string | undefined {
    const c = this.form.get('email');
    if (c?.touched && c.hasError('required')) return 'Campo obligatorio';
    if (c?.touched && c.hasError('email')) return 'Correo electrónico inválido';
    return undefined;
  }

  get phoneError(): string | undefined {
    const c = this.form.get('phone');
    if (c?.touched && c.hasError('required')) return 'Campo obligatorio';
    if (c?.touched && c.hasError('pattern')) return 'Solo se permiten 10 dígitos numéricos';
    return undefined;
  }
}
