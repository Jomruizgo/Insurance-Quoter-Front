import { Injectable } from '@angular/core';

interface AppConfig {
  apiUrl: string;
  coreUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: AppConfig = {
    apiUrl: 'http://localhost:8080',
    coreUrl: 'http://localhost:8081',
  };

  async load(): Promise<void> {
    try {
      const response = await fetch('/assets/config.json');
      const cfg: AppConfig = await response.json();
      this.config = cfg;
    } catch {
      // keep defaults — safe fallback for local dev without Docker
    }
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get coreUrl(): string {
    return this.config.coreUrl;
  }
}
