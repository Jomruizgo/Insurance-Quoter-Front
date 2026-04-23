import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';
import { Subscriber, Agent } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  private readonly subscribers$ = this.http
    .get<{ subscribers: Subscriber[] }>(`${this.config.coreUrl}/v1/subscribers`)
    .pipe(map(r => r.subscribers), shareReplay(1));

  private readonly agents$ = this.http
    .get<{ agents: Agent[] }>(`${this.config.coreUrl}/v1/agents`)
    .pipe(map(r => r.agents), shareReplay(1));

  obtenerSuscriptores(): Observable<Subscriber[]> {
    return this.subscribers$;
  }

  obtenerAgentes(): Observable<Agent[]> {
    return this.agents$;
  }
}
