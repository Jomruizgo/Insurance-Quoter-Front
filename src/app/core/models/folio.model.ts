export type QuoteStatus = 'CREATED' | 'IN_PROGRESS' | 'CALCULATED' | 'ISSUED';
export type SectionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'INCOMPLETE';
export type StepStatus = 'PENDING' | 'INCOMPLETE' | 'COMPLETE';

export interface FolioResponse {
  folioNumber: string;
  quoteStatus: QuoteStatus;
  underwritingData: {
    subscriberId: string;
    agentCode: string;
  };
  createdAt: string;
  version: number;
}

export interface QuoteState {
  folioNumber: string;
  quoteStatus: QuoteStatus;
  completionPercentage: number;
  sections: {
    generalInfo: SectionStatus;
    layout: SectionStatus;
    locations: SectionStatus;
    coverageOptions: SectionStatus;
    calculation: SectionStatus;
  };
  version: number;
  updatedAt: string;
}

export interface StepDefinition {
  key: keyof QuoteState['sections'];
  label: string;
  route: string;
}
