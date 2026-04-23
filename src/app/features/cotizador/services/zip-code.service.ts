import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';
import { ZipCodeInfo } from '../models/zip-code.model';

@Injectable({ providedIn: 'root' })
export class ZipCodeService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  buscar(zipCode: string): Observable<ZipCodeInfo> {
    return this.http.get<ZipCodeInfo>(
      `${this.config.coreUrl}/v1/zip-codes/${zipCode}`
    );
  }
}
