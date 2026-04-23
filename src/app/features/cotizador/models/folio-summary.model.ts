export type QuoteStatus = 'CREATED' | 'IN_PROGRESS' | 'CALCULATED' | 'ISSUED';
export type ViewMode = 'list' | 'grid';

export interface FolioSummary {
  folioNumber: string;
  client: string;
  agentCode: string;
  agentName: string;
  status: QuoteStatus;
  locationCount: number;
  completionPct: number;
  commercialPremium: number | null;
  updatedAt: string; // ISO 8601 UTC
}

export interface FolioListResponse {
  folios: FolioSummary[];
}

export interface DashboardStats {
  total: number;
  inProgress: number;
  readyToIssue: number; // CALCULATED + ISSUED
  accumulatedPremium: number;
}

export interface DashboardFilters {
  searchText: string;
  statusFilter: QuoteStatus | 'ALL';
}
