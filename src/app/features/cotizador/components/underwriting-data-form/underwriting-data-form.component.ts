import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FieldComponent } from '../../../../shared/ui/atoms/field/field.component';
import { SelectComponent } from '../../../../shared/ui/atoms/select/select.component';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge.component';
import { Subscriber, Agent } from '../../../../core/models/catalog.model';

@Component({
  selector: 'app-underwriting-data-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FieldComponent,
    SelectComponent,
    BadgeComponent,
  ],
  templateUrl: './underwriting-data-form.component.html',
  styleUrl: './underwriting-data-form.component.scss',
})
export class UnderwritingDataFormComponent {
  @Input() form!: FormGroup;
  @Input() subscribers: Subscriber[] = [];
  @Input() agents: Agent[] = [];
  @Input() isComplete = false;

  @Output() subscriberChanged = new EventEmitter<string>();

  readonly riskOptions = [
    { value: 'STANDARD', label: 'Riesgo estándar' },
    { value: 'PREFERRED', label: 'Riesgo preferente' },
    { value: 'SUBSTANDARD', label: 'Riesgo subestándar' },
  ];

  readonly businessOptions = [
    { value: 'COMMERCIAL', label: 'Comercial' },
    { value: 'INDUSTRIAL', label: 'Industrial' },
    { value: 'RESIDENTIAL', label: 'Residencial' },
  ];

  onSubscriberChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.subscriberChanged.emit(value);
  }

  get subscriberIdError(): string | undefined {
    const c = this.form.get('subscriberId');
    if (c?.touched && c.hasError('required')) return 'Campo obligatorio';
    return undefined;
  }

  get agentCodeError(): string | undefined {
    const c = this.form.get('agentCode');
    if (c?.touched && c.hasError('required')) return 'Campo obligatorio';
    return undefined;
  }

  get riskError(): string | undefined {
    const c = this.form.get('riskClassification');
    if (c?.touched && c.hasError('required')) return 'Campo obligatorio';
    return undefined;
  }

  get businessError(): string | undefined {
    const c = this.form.get('businessType');
    if (c?.touched && c.hasError('required')) return 'Campo obligatorio';
    return undefined;
  }
}
