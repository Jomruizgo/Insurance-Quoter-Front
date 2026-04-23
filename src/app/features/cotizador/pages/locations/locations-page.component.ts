import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Location, LocationsSummary } from '../../models/location.model';
import { BusinessLine } from '../../models/catalog.model';
import { LocationService } from '../../services/location.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { LocationsAlertBannerComponent } from '../../components/locations-alert-banner/locations-alert-banner.component';
import { LocationsTableComponent } from '../../components/locations-table/locations-table.component';
import { LocationDrawerComponent } from '../../components/location-drawer/location-drawer.component';

@Component({
  selector: 'app-locations-page',
  standalone: true,
  imports: [
    CommonModule,
    LocationsAlertBannerComponent,
    LocationsTableComponent,
    LocationDrawerComponent,
  ],
  template: `
    <div class="locations-page">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header__main">
          <h2 class="page-title">Ubicaciones de riesgo</h2>
          <p class="page-subtitle">
            Folio {{ folio }} · Paso 3 de 5
          </p>
        </div>
        <div class="page-header__stats">
          <span class="stat-chip">
            {{ locations.length }} de {{ totalExpected }} ubicaciones registradas
          </span>
          <span class="stat-chip stat-chip--complete">
            {{ completeCount }} completas
          </span>
          @if (incompleteCount > 0) {
            <span class="stat-chip stat-chip--warn">
              {{ incompleteCount }} con alertas
            </span>
          }
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" type="button" (click)="addLocation()">
            + Añadir ubicación
          </button>
        </div>
      </div>

      <!-- Alert banner -->
      @if (summary) {
        <div class="banner-container">
          <app-locations-alert-banner
            [summary]="summary"
            (verDetalles)="scrollToTable()"
          />
        </div>
      }

      <!-- Loading -->
      @if (loading) {
        <div class="loading-state">
          <span>Cargando ubicaciones...</span>
        </div>
      }

      <!-- Error -->
      @if (error) {
        <div class="error-state">
          <span>{{ error }}</span>
          <button class="btn btn--secondary" type="button" (click)="loadData()">Reintentar</button>
        </div>
      }

      <!-- Table -->
      @if (!loading && !error) {
        <div class="table-container" #tableRef>
          <app-locations-table
            [locations]="locations"
            [totalExpected]="totalExpected"
            (locationSelected)="openDrawer($event)"
            (selectionChanged)="onSelectionChanged($event)"
          />
        </div>
      }

      <!-- Drawer -->
      @if (drawerOpen && selectedLocation) {
        <app-location-drawer
          [location]="selectedLocation"
          [locationIndex]="selectedIndex"
          [folio]="folio"
          [currentVersion]="currentVersion"
          [businessLines]="businessLines"
          (closed)="closeDrawer(false)"
          (saved)="onLocationSaved($event)"
        />
      }
    </div>
  `,
  styles: [`
    .locations-page { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header {
      display: flex; align-items: flex-start; gap: 1rem; flex-wrap: wrap;
      justify-content: space-between;
    }
    .page-header__main { flex: 1; }
    .page-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #111827; }
    .page-subtitle { margin: 0.25rem 0 0; font-size: 0.875rem; color: #6b7280; }
    .page-header__stats { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .stat-chip {
      padding: 0.25rem 0.75rem; border-radius: 9999px;
      font-size: 0.8125rem; background-color: #f3f4f6; color: #374151;
    }
    .stat-chip--complete { background-color: #d1fae5; color: #065f46; }
    .stat-chip--warn { background-color: #fee2e2; color: #991b1b; }
    .page-header__actions { display: flex; align-items: center; }
    .banner-container { max-width: 100%; }
    .loading-state, .error-state {
      display: flex; align-items: center; justify-content: center;
      gap: 1rem; padding: 2rem; color: #6b7280;
    }
    .table-container { overflow-x: auto; }
    .btn {
      padding: 0.5rem 1.25rem; border-radius: 0.375rem;
      font-size: 0.875rem; font-weight: 600; cursor: pointer;
      border: 1px solid transparent;
    }
    .btn--primary { background-color: #2563eb; color: #fff; border-color: #2563eb; }
    .btn--primary:hover { background-color: #1d4ed8; }
    .btn--secondary { background-color: #fff; color: #374151; border-color: #d1d5db; }
    .btn--secondary:hover { background-color: #f9fafb; }
  `],
})
export class LocationsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly locationService = inject(LocationService);
  private readonly catalogService = inject(CatalogService);

  folio = '';
  locations: Location[] = [];
  summary: LocationsSummary | null = null;
  businessLines: BusinessLine[] = [];
  currentVersion = 0;
  totalExpected = 0;
  loading = false;
  error = '';

  drawerOpen = false;
  selectedLocation: Location | null = null;
  selectedIndex = 0;
  selectedIndices: number[] = [];

  get completeCount(): number {
    return this.locations.filter(l => l.validationStatus === 'COMPLETE').length;
  }

  get incompleteCount(): number {
    return this.locations.filter(l => l.validationStatus === 'INCOMPLETE').length;
  }

  ngOnInit(): void {
    this.folio = this.route.snapshot.params['folioNumber'] ?? this.route.snapshot.params['folio'] ?? '';
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      locations: this.locationService.listar(this.folio),
      summary: this.locationService.obtenerResumen(this.folio),
      businessLines: this.catalogService.obtenerGiros(),
    }).subscribe({
      next: ({ locations, summary, businessLines }) => {
        this.locations = locations.locations;
        this.currentVersion = locations.version;
        this.totalExpected = summary.totalLocations > 0
          ? summary.totalLocations
          : locations.locations.length;
        this.summary = summary;
        this.businessLines = businessLines;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las ubicaciones. Verifique la conexión.';
        this.loading = false;
      },
    });
  }

  openDrawer(index: number): void {
    const loc = this.locations.find(l => l.index === index);
    if (loc) {
      this.selectedLocation = loc;
      this.selectedIndex = index;
      this.drawerOpen = true;
    }
  }

  closeDrawer(reload: boolean): void {
    this.drawerOpen = false;
    this.selectedLocation = null;
    if (reload) {
      this.loadData();
    }
  }

  onLocationSaved(event: { location: Location; newVersion: number }): void {
    this.currentVersion = event.newVersion;
    const idx = this.locations.findIndex(l => l.index === event.location.index);
    if (idx !== -1) {
      this.locations = [
        ...this.locations.slice(0, idx),
        event.location,
        ...this.locations.slice(idx + 1),
      ];
    }
    this.closeDrawer(false);
    this.refreshSummary();
  }

  private refreshSummary(): void {
    this.locationService.obtenerResumen(this.folio).subscribe({
      next: (summary) => { this.summary = summary; },
    });
  }

  addLocation(): void {
    const newIndex = this.locations.length + 1;
    const emptyLocation: Partial<Location> = {
      index: newIndex,
      locationName: `Ubicación ${newIndex}`,
      address: '',
      zipCode: '',
      constructionType: 'MASONRY',
      level: 1,
      constructionYear: 2000,
      businessLine: null,
      guarantees: [],
      validationStatus: 'INCOMPLETE',
      blockingAlerts: [],
    };

    this.locationService
      .reemplazarLista(this.folio, [...this.locations, emptyLocation as Location], this.currentVersion)
      .subscribe({
        next: (res) => {
          this.locations = res.locations;
          this.currentVersion = res.version;
          this.totalExpected = res.locations.length;
        },
      });
  }

  onSelectionChanged(indices: number[]): void {
    this.selectedIndices = indices;
  }

  scrollToTable(): void {
    const el = document.querySelector('.table-container');
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}
