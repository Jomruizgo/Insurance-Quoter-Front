import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';
import {
  Location,
  LocationPatchRequest,
  LocationResponse,
  LocationsResponse,
  LocationsSummary,
} from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  listar(folio: string): Observable<LocationsResponse> {
    return this.http.get<LocationsResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/locations`
    );
  }

  obtenerResumen(folio: string): Observable<LocationsSummary> {
    return this.http.get<LocationsSummary>(
      `${this.config.apiUrl}/v1/quotes/${folio}/locations/summary`
    );
  }

  reemplazarLista(
    folio: string,
    locations: Partial<Location>[],
    version: number
  ): Observable<LocationsResponse> {
    return this.http.put<LocationsResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/locations`,
      { locations, version }
    );
  }

  actualizarParcial(
    folio: string,
    index: number,
    fields: LocationPatchRequest
  ): Observable<LocationResponse> {
    return this.http.patch<LocationResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/locations/${index}`,
      fields
    );
  }
}
