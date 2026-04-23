import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';
import { CalculationResult } from '../models/calculation.model';

@Injectable({ providedIn: 'root' })
export class CalculationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  calculate(folio: string, version: number): Observable<CalculationResult> {
    return this.http.post<CalculationResult>(
      `${this.config.apiUrl}/v1/quotes/${folio}/calculate`,
      { version }
    );
  }
}
