import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Location, LocationPatchRequest, ValidationStatus } from '../../models/location.model';
import { BusinessLine } from '../../models/catalog.model';
import { ZipCodeInfo } from '../../models/zip-code.model';
import { LocationService } from '../../services/location.service';
import { ZipCodeService } from '../../services/zip-code.service';
import { LocationBasicDataTabComponent } from './tabs/basic-data-tab.component';
import { LocationConstructionTabComponent } from './tabs/construction-tab.component';
import { LocationBusinessLineTabComponent } from './tabs/business-line-tab.component';
import { LocationGuaranteesTabComponent } from './tabs/guarantees-tab.component';

type DrawerTab = 'basic' | 'construction' | 'businessLine' | 'guarantees';

const GUARANTEE_CODES = ['GUA-FIRE', 'GUA-CONT', 'GUA-THEFT', 'GUA-GLASS', 'GUA-ELEC', 'GUA-CASH'];

@Component({
  selector: 'app-location-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LocationBasicDataTabComponent,
    LocationConstructionTabComponent,
    LocationBusinessLineTabComponent,
    LocationGuaranteesTabComponent,
  ],
  template: `
    <div class="drawer-backdrop" (click)="onCancel()"></div>
    <div class="drawer">
      <!-- Header -->
      <div class="drawer-header">
        <div class="drawer-header__info">
          <span class="drawer-header__index">Ubicación {{ locationIndex }}</span>
          <span class="badge" [class]="badgeClass">
            {{ validationLabel }}
            @if (activeAlerts.length > 0) {
              <span> ({{ activeAlerts.length }})</span>
            }
          </span>
        </div>
        <button class="drawer-close-btn" type="button" (click)="onCancel()" aria-label="Cerrar">
          ✕
        </button>
      </div>

      <!-- Tabs -->
      <div class="drawer-tabs">
        <button
          type="button"
          class="drawer-tab"
          [class.drawer-tab--active]="activeTab === 'basic'"
          (click)="activeTab = 'basic'"
        >Datos básicos</button>
        <button
          type="button"
          class="drawer-tab"
          [class.drawer-tab--active]="activeTab === 'construction'"
          (click)="activeTab = 'construction'"
        >Construcción</button>
        <button
          type="button"
          class="drawer-tab"
          [class.drawer-tab--active]="activeTab === 'businessLine'"
          (click)="activeTab = 'businessLine'"
        >Giro</button>
        <button
          type="button"
          class="drawer-tab"
          [class.drawer-tab--active]="activeTab === 'guarantees'"
          (click)="activeTab = 'guarantees'"
        >Garantías</button>
      </div>

      <!-- Tab content -->
      <div class="drawer-body">
        @if (activeTab === 'basic') {
          <app-location-basic-data-tab
            [form]="basicDataForm"
            [neighborhoods]="neighborhoods"
            [catastrophicInfo]="catastrophicInfo"
            (zipCodeChanged)="onZipCodeChanged($event)"
          />
        }
        @if (activeTab === 'construction') {
          <app-location-construction-tab [form]="constructionForm" />
        }
        @if (activeTab === 'businessLine') {
          <app-location-business-line-tab
            [form]="businessLineForm"
            [businessLines]="businessLines"
          />
        }
        @if (activeTab === 'guarantees') {
          <app-location-guarantees-tab [form]="guaranteesForm" />
        }
      </div>

      <!-- Footer -->
      <div class="drawer-footer">
        @if (zipCodeError) {
          <div class="footer-alert footer-alert--error">{{ zipCodeError }}</div>
        }
        @if (activeAlerts.length > 0) {
          <div class="footer-alerts">
            @for (alert of activeAlerts; track alert) {
              <span class="footer-alert-chip">{{ alertLabel(alert) }}</span>
            }
          </div>
        }
        @if (versionConflictMessage) {
          <div class="footer-alert footer-alert--conflict">{{ versionConflictMessage }}</div>
        }
        <div class="footer-meta">
          <span class="version-badge">v{{ currentVersion }} → v{{ currentVersion + 1 }}</span>
        </div>
        <div class="footer-actions">
          <button
            type="button"
            class="btn btn--secondary"
            (click)="onCancel()"
            [disabled]="saving"
          >Cancelar</button>
          <button
            type="button"
            class="btn btn--primary"
            (click)="onSave()"
            [disabled]="saving"
          >
            @if (saving) { Guardando... } @else { Guardar ubicación }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 40;
    }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 560px; max-width: 100vw;
      background: var(--surface); z-index: 50;
      display: flex; flex-direction: column;
      box-shadow: var(--sh-pop);
      border-left: 1px solid var(--border);
    }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
    }
    .drawer-header__info { display: flex; align-items: center; gap: 0.75rem; }
    .drawer-header__index { font-size: var(--fs-16); font-weight: 600; color: var(--text); }
    .drawer-close-btn {
      background: none; border: none; font-size: 1.1rem;
      cursor: pointer; color: var(--text-dim); padding: 0.25rem;
    }
    .drawer-close-btn:hover { color: var(--text); }
    .badge {
      display: inline-flex; align-items: center;
      padding: 0.2rem 0.5rem; border-radius: var(--r-pill);
      font-size: var(--fs-12); font-weight: 500;
    }
    .badge--complete { background-color: color-mix(in oklch, var(--ok) 15%, transparent); color: var(--ok); }
    .badge--incomplete { background-color: color-mix(in oklch, var(--err) 12%, transparent); color: var(--err); }
    .drawer-tabs {
      display: flex; border-bottom: 1px solid var(--border);
      padding: 0 1.25rem; gap: 0;
    }
    .drawer-tab {
      padding: 0.625rem 1rem; font-size: var(--fs-13);
      background: none; border: none; cursor: pointer;
      color: var(--text-dim); border-bottom: 2px solid transparent;
      margin-bottom: -1px; font-family: inherit;
    }
    .drawer-tab--active { color: var(--text); border-bottom-color: var(--brand-500); font-weight: 600; }
    .drawer-body {
      flex: 1; overflow-y: auto; padding: 0 1.25rem;
    }
    .drawer-footer {
      border-top: 1px solid var(--border);
      padding: 0.875rem 1.25rem;
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .footer-alerts { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .footer-alert-chip {
      background-color: color-mix(in oklch, var(--warn) 12%, transparent); color: var(--warn);
      padding: 0.2rem 0.5rem; border-radius: var(--r-pill); font-size: var(--fs-12); font-weight: 500;
    }
    .footer-alert { padding: 0.5rem 0.75rem; border-radius: var(--r-md); font-size: var(--fs-13); }
    .footer-alert--error { background-color: color-mix(in oklch, var(--err) 10%, transparent); color: var(--err); }
    .footer-alert--conflict { background-color: color-mix(in oklch, var(--warn) 10%, transparent); color: var(--warn); }
    .footer-meta { display: flex; align-items: center; justify-content: flex-start; }
    .version-badge {
      font-size: var(--fs-12); color: var(--text-dim);
      background: var(--surface-2); padding: 0.2rem 0.5rem; border-radius: var(--r-xs);
    }
    .footer-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
    .btn {
      padding: 0.5rem 1.25rem; border-radius: var(--r-md);
      font-size: var(--fs-14); font-weight: 500; cursor: pointer;
      border: 1px solid transparent; font-family: inherit;
    }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn--primary { background-color: var(--brand-500); color: var(--ink-900); border-color: var(--brand-500); }
    .btn--primary:hover:not(:disabled) { background-color: var(--brand-600); border-color: var(--brand-600); }
    .btn--secondary { background-color: var(--surface); color: var(--text); border-color: var(--border-strong); }
    .btn--secondary:hover:not(:disabled) { background-color: var(--surface-2); }
  `],
})
export class LocationDrawerComponent implements OnInit {
  @Input() location!: Location;
  @Input() locationIndex!: number;
  @Input() folio!: string;
  @Input() currentVersion!: number;
  @Input() businessLines: BusinessLine[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ location: Location; newVersion: number }>();

  private readonly fb = inject(FormBuilder);
  private readonly locationService = inject(LocationService);
  private readonly zipCodeService = inject(ZipCodeService);

  form!: FormGroup;
  activeTab: DrawerTab = 'basic';
  neighborhoods: string[] = [];
  catastrophicInfo?: { tevZone: string; fhmZone: string; catastrophicZone: string };
  zipCodeError = '';
  versionConflictMessage = '';
  saving = false;

  private initialFormValue: unknown;

  get basicDataForm(): FormGroup {
    return this.form.get('basicData') as FormGroup;
  }

  get constructionForm(): FormGroup {
    return this.form.get('construction') as FormGroup;
  }

  get businessLineForm(): FormGroup {
    return this.form.get('businessLine') as FormGroup;
  }

  get guaranteesForm(): FormGroup {
    return this.form.get('guaranteesGroup') as FormGroup;
  }

  get activeAlerts(): string[] {
    const alerts: string[] = [];
    const basicData = this.basicDataForm.value;
    const businessLineCode = this.businessLineForm.get('businessLineCode')?.value;

    if (!basicData.zipCode || basicData.zipCode.length < 5 || this.zipCodeError) {
      alerts.push('MISSING_ZIP_CODE');
    }
    if (!businessLineCode) {
      alerts.push('MISSING_FIRE_KEY');
    }

    const guaranteesArray = this.form.get('guaranteesGroup.guarantees') as FormArray;
    const hasActiveTarifable = guaranteesArray?.controls.some(ctrl => {
      return ctrl.get('active')?.value && (ctrl.get('insuredValue')?.value ?? 0) > 0;
    });
    if (!hasActiveTarifable) {
      alerts.push('NO_TARIFABLE');
    }

    return alerts;
  }

  get validationLabel(): string {
    return this.activeAlerts.length === 0 ? 'Completa' : 'Incompleta';
  }

  get badgeClass(): string {
    return this.activeAlerts.length === 0 ? 'badge--complete' : 'badge--incomplete';
  }

  get currentValidationStatus(): ValidationStatus {
    return this.activeAlerts.length === 0 ? 'COMPLETE' : 'INCOMPLETE';
  }

  alertLabel(code: string): string {
    const labels: Record<string, string> = {
      MISSING_ZIP_CODE: 'CP faltante',
      MISSING_FIRE_KEY: 'Clave incendio faltante',
      NO_TARIFABLE: 'Sin garantías activas',
    };
    return labels[code] ?? code;
  }

  ngOnInit(): void {
    this.buildForm();
    this.initialFormValue = this.form.getRawValue();

    if (this.location.catastrophicZone || this.location.tevZone || this.location.fhmZone) {
      this.catastrophicInfo = {
        tevZone: this.location.tevZone ?? '',
        fhmZone: this.location.fhmZone ?? '',
        catastrophicZone: this.location.catastrophicZone ?? '',
      };
    }
  }

  private buildForm(): void {
    const loc = this.location;

    const guaranteesControls = GUARANTEE_CODES.map(code => {
      const existing = loc.guarantees?.find(g => g.code === code);
      const active = !!existing && existing.insuredValue > 0;
      return this.fb.group({
        code: [code],
        active: [active],
        insuredValue: [{ value: existing?.insuredValue ?? 0, disabled: !active }],
      });
    });

    this.form = this.fb.group({
      basicData: this.fb.group({
        locationName: [loc.locationName ?? '', Validators.required],
        address: [loc.address ?? ''],
        zipCode: [loc.zipCode ?? ''],
        neighborhood: [loc.neighborhood ?? ''],
        state: [loc.state ?? ''],
        municipality: [loc.municipality ?? ''],
        city: [loc.city ?? ''],
      }),
      construction: this.fb.group({
        constructionType: [loc.constructionType ?? 'MASONRY', Validators.required],
        level: [loc.level ?? 1, [Validators.required, Validators.min(1), Validators.max(50)]],
        constructionYear: [loc.constructionYear ?? 2000, [Validators.required, Validators.min(1900), Validators.max(2026)]],
      }),
      businessLine: this.fb.group({
        businessLineCode: [loc.businessLine?.code ?? ''],
      }),
      guaranteesGroup: this.fb.group({
        guarantees: this.fb.array(guaranteesControls),
      }),
    });

    this.form.get('basicData.state')?.disable();
    this.form.get('basicData.municipality')?.disable();
    this.form.get('basicData.city')?.disable();
  }

  onZipCodeChanged(zipCode: string): void {
    this.zipCodeError = '';
    this.zipCodeService.buscar(zipCode).subscribe({
      next: (info: ZipCodeInfo) => {
        this.neighborhoods = info.neighborhoods;
        this.basicDataForm.patchValue({
          state: info.state,
          municipality: info.municipality,
          city: info.city,
          neighborhood: '',
        });
        this.catastrophicInfo = {
          tevZone: info.tevZone,
          fhmZone: info.fhmZone,
          catastrophicZone: info.catastrophicZone,
        };
      },
      error: (err: { status?: number }) => {
        this.zipCodeError = err.status === 404
          ? 'Código postal no encontrado en el catálogo'
          : 'Error al consultar el catálogo. Intente de nuevo.';
        this.neighborhoods = [];
        this.basicDataForm.patchValue({ state: '', municipality: '', city: '', neighborhood: '' });
        this.catastrophicInfo = undefined;
      },
    });
  }

  onCancel(): void {
    this.closed.emit();
  }

  onSave(): void {
    this.saving = true;
    this.versionConflictMessage = '';

    const patch = this.buildPatchRequest();

    this.locationService.actualizarParcial(this.folio, this.locationIndex, patch).subscribe({
      next: (res) => {
        this.saving = false;
        this.saved.emit({ location: res.location, newVersion: res.version });
      },
      error: (err: { status?: number }) => {
        this.saving = false;
        if (err.status === 409) {
          this.versionConflictMessage = 'El folio fue modificado por otro proceso. Recargando datos...';
          this.locationService.listar(this.folio).subscribe({
            next: (res) => {
              const updated = res.locations.find(l => l.index === this.locationIndex);
              if (updated) {
                this.location = updated;
                this.currentVersion = res.version;
                this.buildForm();
                this.initialFormValue = this.form.getRawValue();
                if (updated.catastrophicZone || updated.tevZone || updated.fhmZone) {
                  this.catastrophicInfo = {
                    tevZone: updated.tevZone ?? '',
                    fhmZone: updated.fhmZone ?? '',
                    catastrophicZone: updated.catastrophicZone ?? '',
                  };
                }
              }
              setTimeout(() => { this.versionConflictMessage = ''; }, 2000);
            },
            error: () => this.closed.emit(),
          });
        }
      },
    });
  }

  private buildPatchRequest(): LocationPatchRequest {
    const current = this.form.getRawValue();
    const initial = this.initialFormValue as ReturnType<typeof this.form.getRawValue>;
    const patch: LocationPatchRequest = { version: this.currentVersion };

    const basic = current['basicData'];
    const initialBasic = (initial as { basicData: typeof basic })['basicData'];

    if (basic['locationName'] !== initialBasic['locationName']) patch.locationName = basic['locationName'];
    if (basic['address'] !== initialBasic['address']) patch.address = basic['address'];
    if (basic['zipCode'] !== initialBasic['zipCode']) patch.zipCode = basic['zipCode'];
    if (basic['neighborhood'] !== initialBasic['neighborhood']) patch.neighborhood = basic['neighborhood'];

    const constr = current['construction'];
    const initialConstr = (initial as { construction: typeof constr })['construction'];

    if (constr['constructionType'] !== initialConstr['constructionType']) patch.constructionType = constr['constructionType'];
    if (constr['level'] !== initialConstr['level']) patch.level = Number(constr['level']);
    if (constr['constructionYear'] !== initialConstr['constructionYear']) patch.constructionYear = Number(constr['constructionYear']);

    const blCode = current['businessLine']['businessLineCode'];
    const bl = this.businessLines.find(b => b.code === blCode);
    patch.businessLine = bl ? { code: bl.code, fireKey: bl.fireKey } : null;

    const guaranteesRaw = current['guaranteesGroup']['guarantees'] as Array<{ code: string; active: boolean; insuredValue: number }>;
    patch.guarantees = guaranteesRaw.map(g => ({
      code: g.code,
      insuredValue: g.active ? Number(g.insuredValue) : 0,
    }));

    return patch;
  }
}
