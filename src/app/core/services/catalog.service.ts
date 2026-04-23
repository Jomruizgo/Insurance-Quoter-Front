import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';
import { Subscriber, Agent, BusinessLine } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  private subscribers$: Observable<Subscriber[]> | null = null;
  private agents$: Observable<Agent[]> | null = null;
  private businessLines$: Observable<BusinessLine[]> | null = null;

  obtenerSuscriptores(): Observable<Subscriber[]> {
    if (!this.subscribers$) {
      this.subscribers$ = this.http
        .get<{ subscribers: Subscriber[] }>(`${this.config.coreUrl}/v1/subscribers`)
        .pipe(map(r => r.subscribers), shareReplay(1));
    }
    return this.subscribers$.pipe(
      catchError(err => {
        this.subscribers$ = null;
        return throwError(() => err);
      })
    );
  }

  obtenerAgentes(): Observable<Agent[]> {
    if (!this.agents$) {
      this.agents$ = this.http
        .get<{ agents: Agent[] }>(`${this.config.coreUrl}/v1/agents`)
        .pipe(map(r => r.agents), shareReplay(1));
    }
    return this.agents$.pipe(
      catchError(err => {
        this.agents$ = null;
        return throwError(() => err);
      })
    );
  }

  obtenerGiros(): Observable<BusinessLine[]> {
    if (!this.businessLines$) {
      this.businessLines$ = this.http
        .get<{ businessLines: BusinessLine[] }>(`${this.config.apiUrl}/v1/business-lines`)
        .pipe(map(r => r.businessLines), shareReplay(1));
    }
    return this.businessLines$.pipe(
      catchError(err => {
        this.businessLines$ = null;
        return throwError(() => err);
      })
    );
  }
}
