import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';
import { AcceptanceResponse } from '../models/terms.model';

@Injectable({ providedIn: 'root' })
export class TermsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  aceptar(folio: string, acceptedBy: string, version: number): Observable<AcceptanceResponse> {
    return this.http.post<AcceptanceResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/accept`,
      { acceptedBy, version }
    );
  }
}
