import { QuoteStatus } from '../../../core/models/folio.model';

export type RiskClassification = 'STANDARD' | 'PREFERRED' | 'SUBSTANDARD';
export type BusinessType = 'COMMERCIAL' | 'INDUSTRIAL' | 'RESIDENTIAL';

export interface InsuredData {
  name: string;
  rfc: string;
  email: string;
  phone: string;
}

export interface UnderwritingData {
  subscriberId: string;
  agentCode: string;
  riskClassification: RiskClassification;
  businessType: BusinessType;
}

export interface GeneralInfoRequest {
  insuredData: InsuredData;
  underwritingData: UnderwritingData;
  version: number;
}

export interface GeneralInfoResponse {
  folioNumber: string;
  quoteStatus: QuoteStatus;
  insuredData: InsuredData;
  underwritingData: UnderwritingData;
  updatedAt: string;
  version: number;
}
