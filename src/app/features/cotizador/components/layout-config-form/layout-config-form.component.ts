import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { SectionHeaderComponent } from '../../../../shared/ui/atoms/section-header/section-header.component';
import { BtnComponent } from '../../../../shared/ui/atoms/btn/btn.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import {
  LayoutConfigResponse,
  LocationType,
} from '../../models/layout-config.model';

function integerValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (val === null || val === undefined || val === '') return null;
  return Number.isInteger(Number(val)) ? null : { integer: true };
}

interface LocationTypeOption {
  value: LocationType;
  label: string;
}

@Component({
  selector: 'app-layout-config-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SectionHeaderComponent,
    BtnComponent,
    IconComponent,
  ],
  templateUrl: './layout-config-form.component.html',
  styleUrl: './layout-config-form.component.scss',
})
export class LayoutConfigFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() folio: string = '';
  @Input() initialData: LayoutConfigResponse | null = null;
  @Input() saveDisabled = false;
  @Output() saved = new EventEmitter<LayoutConfigResponse>();

  protected readonly locationTypeOptions: LocationTypeOption[] = [
    { value: 'SINGLE', label: 'Ubicación única' },
    { value: 'MULTIPLE', label: 'Múltiples ubicaciones' },
    { value: 'DISTRIBUTED', label: 'Distribuida' },
  ];

  protected form: FormGroup = this.fb.group({
    numberOfLocations: [
      null,
      [Validators.required, Validators.min(1), Validators.max(50), integerValidator],
    ],
    locationType: [null, Validators.required],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.initialData?.layoutConfiguration) {
      this.form.patchValue({
        numberOfLocations: this.initialData.layoutConfiguration.numberOfLocations,
        locationType: this.initialData.layoutConfiguration.locationType,
      });
    }
  }

  protected selectLocationType(value: LocationType): void {
    this.form.get('locationType')?.setValue(value);
    this.form.get('locationType')?.markAsTouched();
  }

  protected isLocationTypeSelected(value: LocationType): boolean {
    return this.form.get('locationType')?.value === value;
  }

  protected get numberOfLocationsError(): string {
    const ctrl = this.form.get('numberOfLocations');
    if (!ctrl || !ctrl.dirty || ctrl.valid) return '';
    if (ctrl.hasError('required')) return 'El número de ubicaciones es obligatorio';
    if (ctrl.hasError('integer')) return 'El número de ubicaciones debe ser un entero';
    if (ctrl.hasError('min') || ctrl.hasError('max')) {
      return 'El número de ubicaciones debe estar entre 1 y 50';
    }
    return '';
  }

  protected get locationTypeError(): string {
    const ctrl = this.form.get('locationType');
    if (!ctrl || !ctrl.dirty || ctrl.valid) return '';
    if (ctrl.hasError('required')) return 'Selecciona un tipo de ubicación';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid || this.saveDisabled) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value as {
      numberOfLocations: number;
      locationType: LocationType;
    };

    const result: LayoutConfigResponse = {
      folioNumber: this.folio,
      layoutConfiguration: {
        numberOfLocations: Number(formValue.numberOfLocations),
        locationType: formValue.locationType,
      },
      version: this.initialData?.version ?? 0,
      updatedAt: this.initialData?.updatedAt,
    };

    this.saved.emit(result);
  }
}
