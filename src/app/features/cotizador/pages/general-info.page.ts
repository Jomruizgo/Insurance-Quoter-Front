import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeneralInfoService } from '../services/general-info.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { InsuredDataFormComponent } from '../components/insured-data-form/insured-data-form.component';
import { UnderwritingDataFormComponent } from '../components/underwriting-data-form/underwriting-data-form.component';
import { SectionHeaderComponent } from '../../../shared/ui/atoms/section-header/section-header.component';
import { Subscriber, Agent } from '../../../core/models/catalog.model';
import { rfcValidator } from '../validators/rfc.validator';
import { GeneralInfoRequest } from '../models/general-info.model';

@Component({
  selector: 'app-general-info-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InsuredDataFormComponent,
    UnderwritingDataFormComponent,
    SectionHeaderComponent,
  ],
  templateUrl: './general-info.page.html',
  styleUrl: './general-info.page.scss',
})
export class GeneralInfoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly generalInfoService = inject(GeneralInfoService);
  private readonly catalogService = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);

  protected folioNumber = '';
  protected currentVersion = 0;
  protected loading = false;
  protected errorMessage = '';

  protected allSubscribers: Subscriber[] = [];
  protected allAgents: Agent[] = [];
  protected filteredAgents: Agent[] = [];

  protected form!: FormGroup;

  get insuredDataForm(): FormGroup {
    return this.form.get('insuredData') as FormGroup;
  }

  get underwritingDataForm(): FormGroup {
    return this.form.get('underwritingData') as FormGroup;
  }

  get isInsuredComplete(): boolean {
    return this.insuredDataForm?.valid ?? false;
  }

  get isUnderwritingComplete(): boolean {
    return this.underwritingDataForm?.valid ?? false;
  }

  ngOnInit(): void {
    this.folioNumber = this.route.snapshot.params['folioNumber'] ?? '';

    this.form = this.fb.group({
      insuredData: this.fb.group({
        name:  ['', Validators.required],
        rfc:   ['', [Validators.required, rfcValidator()]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      }),
      underwritingData: this.fb.group({
        subscriberId:       ['', Validators.required],
        agentCode:          ['', Validators.required],
        riskClassification: ['', Validators.required],
        businessType:       ['', Validators.required],
      }),
    });

    forkJoin({
      info:        this.generalInfoService.cargar(this.folioNumber),
      subscribers: this.catalogService.obtenerSuscriptores(),
      agents:      this.catalogService.obtenerAgentes(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ info, subscribers, agents }) => {
          this.allSubscribers = subscribers;
          this.allAgents = agents;
          this.currentVersion = info.version;

          this.filteredAgents = agents.filter(
            a => a.subscriberId === info.underwritingData.subscriberId
          );

          this.form.patchValue({
            insuredData:      info.insuredData,
            underwritingData: info.underwritingData,
          });
        },
        error: (err) => {
          this.errorMessage = `Error al cargar los datos (${err.status ?? 'desconocido'})`;
        },
      });
  }

  onSubscriberChanged(subscriberId: string): void {
    this.filteredAgents = this.allAgents.filter(a => a.subscriberId === subscriberId);
    const currentAgent = this.underwritingDataForm.get('agentCode')?.value;
    const agentStillValid = this.filteredAgents.some(a => a.code === currentAgent);
    if (!agentStillValid) {
      this.underwritingDataForm.get('agentCode')?.setValue('');
    }
  }

  goBack(): void {
    this.router.navigate(['/cotizador']);
  }

  saveDraft(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const request: GeneralInfoRequest = {
      insuredData:      this.form.value.insuredData,
      underwritingData: this.form.value.underwritingData,
      version:          this.currentVersion,
    };
    this.generalInfoService
      .guardar(this.folioNumber, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.currentVersion = res.version; this.loading = false; },
        error: () => { this.loading = false; },
      });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const request: GeneralInfoRequest = {
      insuredData:      this.form.value.insuredData,
      underwritingData: this.form.value.underwritingData,
      version:          this.currentVersion,
    };

    this.generalInfoService
      .guardar(this.folioNumber, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.currentVersion = res.version;
          this.loading = false;
          this.router.navigate(['/cotizador', 'quotes', this.folioNumber, 'layout']);
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 409) {
            this.errorMessage =
              'El folio fue modificado por otra sesión. Recarga para obtener la versión actual.';
          } else if (err.status === 422) {
            const fields: { field: string; message: string }[] = err.error?.fields ?? [];
            this.errorMessage = fields.length > 0
              ? `Errores de validación: ${fields.map(f => f.message ?? f.field).join(', ')}`
              : 'Los datos enviados contienen errores de validación. Revisa los campos e intenta de nuevo.';
          } else {
            this.errorMessage = `Error al guardar (${err.status ?? 'desconocido'})`;
          }
        },
      });
  }
}
