import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { FolioResponse } from '../models/folio.model';

@Injectable({ providedIn: 'root' })
export class FolioService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  crearFolio(subscriberId: string, agentCode: string): Observable<FolioResponse> {
    return this.http.post<FolioResponse>(`${this.config.apiUrl}/v1/folios`, { subscriberId, agentCode });
  }
}
