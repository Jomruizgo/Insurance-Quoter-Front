import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Location, ValidationStatus } from '../../models/location.model';

@Component({
  selector: 'app-locations-table',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="locations-table-wrapper">
      <table class="locations-table">
        <thead>
          <tr>
            <th class="col-check">
              <input
                type="checkbox"
                [checked]="allSelected"
                [indeterminate]="someSelected && !allSelected"
                (change)="toggleAll($event)"
                aria-label="Seleccionar todas"
              />
            </th>
            <th>#</th>
            <th>Nombre</th>
            <th>Dirección · CP</th>
            <th>Giro</th>
            <th>Construcción</th>
            <th>Suma asegurada</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (loc of locations; track loc.index) {
            <tr
              [class.selected]="selectedIndices.has(loc.index)"
              (click)="onRowClick(loc.index, $event)"
            >
              <td class="col-check" (click)="$event.stopPropagation()">
                <input
                  type="checkbox"
                  [checked]="selectedIndices.has(loc.index)"
                  (change)="toggleRow(loc.index)"
                  [attr.aria-label]="'Seleccionar ubicación ' + loc.index"
                />
              </td>
              <td>{{ loc.index }}</td>
              <td>{{ loc.locationName }}</td>
              <td>
                <div>{{ loc.address }}</div>
                <div
                  class="zip-code"
                  [class.zip-code--error]="hasMissingZipAlert(loc)"
                >{{ loc.zipCode || '—' }}</div>
              </td>
              <td>
                @if (loc.businessLine) {
                  <div>{{ loc.businessLine.code }}</div>
                  <div
                    class="fire-key"
                    [class.fire-key--error]="hasMissingFireKeyAlert(loc)"
                  >{{ loc.businessLine.fireKey }}</div>
                } @else {
                  <span class="empty-cell">Sin giro</span>
                }
              </td>
              <td>
                <div>{{ constructionTypeLabel(loc.constructionType) }}</div>
                <div class="sub-info">Nivel {{ loc.level }} · {{ loc.constructionYear }}</div>
              </td>
              <td>{{ totalInsuredValue(loc) | currency:'MXN':'symbol-narrow':'1.0-0' }}</td>
              <td>
                <span class="badge" [class]="badgeClass(loc.validationStatus)">
                  {{ validationLabel(loc.validationStatus) }}
                  @if (loc.blockingAlerts.length > 0) {
                    <span class="badge__count"> ({{ loc.blockingAlerts.length }})</span>
                  }
                </span>
              </td>
            </tr>
          }
        </tbody>
        <tfoot>
          <tr class="footer-row">
            <td colspan="6" class="footer-label">
              @if (pendingCount > 0) {
                <button class="add-btn" type="button" (click)="$event.stopPropagation()">
                  + Añadir {{ pendingCount }} ubicaciones restantes
                </button>
              }
            </td>
            <td class="footer-total">
              {{ grandTotal | currency:'MXN':'symbol-narrow':'1.0-0' }}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `,
  styles: [`
    .locations-table-wrapper {
      overflow-x: auto;
    }
    .locations-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--fs-13);
    }
    .locations-table th,
    .locations-table td {
      padding: 0.625rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .locations-table th {
      background-color: var(--surface-2);
      font-weight: 500;
      color: var(--text-dim);
      font-size: var(--fs-12);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .locations-table tbody tr {
      cursor: pointer;
      transition: background-color var(--t-fast) var(--ease);
    }
    .locations-table tbody tr:hover {
      background-color: var(--surface-2);
    }
    .locations-table tbody tr.selected {
      background-color: color-mix(in oklch, var(--brand-500) 10%, transparent);
    }
    .col-check { width: 2.5rem; }
    .zip-code { font-size: var(--fs-12); color: var(--text-dim); }
    .zip-code--error { color: var(--err); font-weight: 600; }
    .fire-key { font-size: var(--fs-12); color: var(--text-dim); }
    .fire-key--error { color: var(--err); font-weight: 600; }
    .sub-info { font-size: var(--fs-12); color: var(--text-dim); }
    .empty-cell { color: var(--text-mute); font-style: italic; }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      border-radius: var(--r-pill);
      font-size: var(--fs-12);
      font-weight: 500;
    }
    .badge--complete { background-color: color-mix(in oklch, var(--ok) 15%, transparent); color: var(--ok); }
    .badge--incomplete { background-color: color-mix(in oklch, var(--err) 12%, transparent); color: var(--err); }
    .footer-row td {
      background-color: var(--surface-2);
      font-weight: 600;
    }
    .footer-label { color: var(--text-dim); }
    .footer-total { text-align: right; }
    .add-btn {
      background: none;
      border: 1px dashed var(--border-strong);
      border-radius: var(--r-xs);
      padding: 0.25rem 0.75rem;
      cursor: pointer;
      color: var(--text-dim);
      font-size: var(--fs-12);
    }
    .add-btn:hover { background-color: var(--surface-2); }
  `],
})
export class LocationsTableComponent implements OnChanges {
  @Input() locations: Location[] = [];
  @Input() totalExpected: number = 0;
  @Output() locationSelected = new EventEmitter<number>();
  @Output() selectionChanged = new EventEmitter<number[]>();

  selectedIndices = new Set<number>();

  get allSelected(): boolean {
    return this.locations.length > 0 &&
      this.locations.every(l => this.selectedIndices.has(l.index));
  }

  get someSelected(): boolean {
    return this.locations.some(l => this.selectedIndices.has(l.index));
  }

  get pendingCount(): number {
    const pending = this.totalExpected - this.locations.length;
    return pending > 0 ? pending : 0;
  }

  get grandTotal(): number {
    return this.locations.reduce((sum, loc) => sum + this.totalInsuredValue(loc), 0);
  }

  ngOnChanges(): void {
    // clean up selected indices that no longer exist
    const validIndices = new Set(this.locations.map(l => l.index));
    this.selectedIndices = new Set(
      [...this.selectedIndices].filter(i => validIndices.has(i))
    );
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.locations.forEach(l => this.selectedIndices.add(l.index));
    } else {
      this.selectedIndices.clear();
    }
    this.selectionChanged.emit([...this.selectedIndices]);
  }

  toggleRow(index: number): void {
    if (this.selectedIndices.has(index)) {
      this.selectedIndices.delete(index);
    } else {
      this.selectedIndices.add(index);
    }
    this.selectionChanged.emit([...this.selectedIndices]);
  }

  onRowClick(index: number, event: MouseEvent): void {
    this.locationSelected.emit(index);
  }

  hasMissingZipAlert(loc: Location): boolean {
    return loc.blockingAlerts.some(a => a.code === 'MISSING_ZIP_CODE');
  }

  hasMissingFireKeyAlert(loc: Location): boolean {
    return loc.blockingAlerts.some(a => a.code === 'MISSING_FIRE_KEY');
  }

  totalInsuredValue(loc: Location): number {
    return loc.guarantees.reduce((sum, g) => sum + (g.insuredValue ?? 0), 0);
  }

  constructionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      MASONRY: 'Mampostería',
      STEEL: 'Estructura metálica',
      CONCRETE: 'Concreto armado',
      WOOD: 'Madera',
      MIXED: 'Mixto',
    };
    return labels[type] ?? type;
  }

  validationLabel(status: ValidationStatus): string {
    return status === 'COMPLETE' ? 'Completa' : 'Incompleta';
  }

  badgeClass(status: ValidationStatus): string {
    return status === 'COMPLETE' ? 'badge--complete' : 'badge--incomplete';
  }
}
