import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
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
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        // RN-05: endpoint not yet implemented — use optimistic response
        if (err.status === 404) {
          const optimistic: AcceptanceResponse = {
            folioNumber: folio,
            quoteStatus: 'ISSUED',
            acceptedBy,
            acceptedAt: new Date().toISOString(),
            version: version + 1,
          };
          return of(optimistic);
        }
        throw err;
      })
    );
  }
}
