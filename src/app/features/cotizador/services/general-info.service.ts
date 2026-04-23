import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';
import { GeneralInfoRequest, GeneralInfoResponse } from '../models/general-info.model';

@Injectable({ providedIn: 'root' })
export class GeneralInfoService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  cargar(folio: string): Observable<GeneralInfoResponse> {
    return this.http.get<GeneralInfoResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/general-info`
    );
  }

  guardar(folio: string, request: GeneralInfoRequest): Observable<GeneralInfoResponse> {
    return this.http.put<GeneralInfoResponse>(
      `${this.config.apiUrl}/v1/quotes/${folio}/general-info`,
      request
    );
  }
}
