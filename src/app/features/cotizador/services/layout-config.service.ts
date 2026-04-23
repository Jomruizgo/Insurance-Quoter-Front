import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';
import {
  LayoutConfiguration,
  LayoutConfigResponse,
  SaveLayoutConfigRequest,
} from '../models/layout-config.model';

@Injectable({ providedIn: 'root' })
export class LayoutConfigService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  load(folio: string): Observable<LayoutConfigResponse> {
    return this.http.get<LayoutConfigResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/locations/layout`
    );
  }

  save(
    folio: string,
    layoutConfiguration: LayoutConfiguration,
    version: number
  ): Observable<LayoutConfigResponse> {
    const body: SaveLayoutConfigRequest = { layoutConfiguration, version };
    return this.http.put<LayoutConfigResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/locations/layout`,
      body
    );
  }
}
