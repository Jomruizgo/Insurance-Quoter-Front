import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';
import {
  CoverageOptionRequest,
  CoverageOptionsResponse,
} from '../models/coverage.model';

@Injectable({ providedIn: 'root' })
export class CoverageService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  obtener(folio: string): Observable<CoverageOptionsResponse> {
    return this.http.get<CoverageOptionsResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/coverage-options`
    );
  }

  guardar(
    folio: string,
    options: CoverageOptionRequest[],
    version: number
  ): Observable<CoverageOptionsResponse> {
    return this.http.put<CoverageOptionsResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/coverage-options`,
      { coverageOptions: options, version }
    );
  }
}
