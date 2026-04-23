export interface AcceptanceRequest {
  acceptedBy: string;
  version: number;
}

export interface AcceptanceResponse {
  folioNumber: string;
  quoteStatus: 'ISSUED';
  acceptedBy: string;
  acceptedAt: string; // ISO 8601 UTC
  version: number;
}
