import { Injectable, inject, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from '../../../core/services/app-config.service';
import { FolioSummary, FolioListResponse } from '../models/folio-summary.model';

// Mock data — used when USE_MOCK_FOLIOS token is true (dev without backend)
export const MOCK_FOLIOS: FolioSummary[] = [
  {
    folioNumber: 'FOL-2026-00001',
    client: 'Empresa Alfa SA de CV',
    agentCode: 'AGT-001',
    agentName: 'Carlos López',
    status: 'CREATED',
    locationCount: 1,
    completionPct: 10,
    commercialPremium: null,
    updatedAt: '2026-04-20T10:00:00Z',
  },
  {
    folioNumber: 'FOL-2026-00002',
    client: 'Grupo Beta SRL',
    agentCode: 'AGT-002',
    agentName: 'María García',
    status: 'IN_PROGRESS',
    locationCount: 3,
    completionPct: 60,
    commercialPremium: 125000,
    updatedAt: '2026-04-21T09:00:00Z',
  },
  {
    folioNumber: 'FOL-2026-00003',
    client: 'Constructora Gama SA',
    agentCode: 'AGT-003',
    agentName: 'Roberto Díaz',
    status: 'CALCULATED',
    locationCount: 5,
    completionPct: 85,
    commercialPremium: 340000,
    updatedAt: '2026-04-19T14:30:00Z',
  },
  {
    folioNumber: 'FOL-2026-00004',
    client: 'Inmobiliaria Delta SC',
    agentCode: 'AGT-001',
    agentName: 'Carlos López',
    status: 'ISSUED',
    locationCount: 2,
    completionPct: 100,
    commercialPremium: 87500,
    updatedAt: '2026-04-18T11:00:00Z',
  },
  {
    folioNumber: 'FOL-2026-00005',
    client: 'Manufactura Épsilon SA de CV',
    agentCode: 'AGT-004',
    agentName: 'Laura Méndez',
    status: 'IN_PROGRESS',
    locationCount: 4,
    completionPct: 45,
    commercialPremium: null,
    updatedAt: '2026-04-22T08:00:00Z',
  },
];

// Injection token to control mock mode — true in dev, false in prod, overridable in tests
export const USE_MOCK_FOLIOS = new InjectionToken<boolean>('USE_MOCK_FOLIOS', {
  providedIn: 'root',
  factory: () => true, // default: dev mock active
});

@Injectable({ providedIn: 'root' })
export class FolioListService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly useMock = inject(USE_MOCK_FOLIOS);

  listFolios(): Observable<FolioSummary[]> {
    if (this.useMock) {
      return of(MOCK_FOLIOS);
    }
    return this.http
      .get<FolioListResponse>(`${this.config.apiUrl}/v1/folios`)
      .pipe(map(response => response.folios));
  }
}
