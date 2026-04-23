import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { QuoteState } from '../models/folio.model';

@Injectable({ providedIn: 'root' })
export class QuoteStateService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  obtenerEstado(folio: string): Observable<QuoteState> {
    return this.http.get<QuoteState>(`${this.config.apiUrl}/v1/quotes/${folio}/state`);
  }
}
