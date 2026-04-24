export type CoverageCode =
  | 'COV-FIRE'
  | 'COV-CAT'
  | 'COV-THEFT'
  | 'COV-BI'
  | 'COV-ELEC'
  | 'COV-GLASS';

export interface CoverageOption {
  code: CoverageCode;
  description: string;
  selected: boolean;
  deductiblePercentage: number;
  coinsurancePercentage: number;
}

export interface CoverageOptionsResponse {
  folioNumber: string;
  coverageOptions: CoverageOption[];
  version: number;
  updatedAt?: string;
}

export interface CoverageOptionRequest {
  code: CoverageCode;
  selected: boolean;
  deductiblePercentage: number;
  coinsurancePercentage: number;
}

export interface CoverageOptionsRequest {
  coverageOptions: CoverageOptionRequest[];
  version: number;
}
