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

export const DEFAULT_COVERAGE_OPTIONS: CoverageOption[] = [
  { code: 'COV-FIRE',  description: 'Incendio y riesgos adicionales',        selected: false, deductiblePercentage: 2.0,  coinsurancePercentage: 80.0  },
  { code: 'COV-CAT',   description: 'Cobertura catastrófica CATTEV/CATFHM',  selected: false, deductiblePercentage: 3.0,  coinsurancePercentage: 90.0  },
  { code: 'COV-THEFT', description: 'Robo con violencia',                    selected: false, deductiblePercentage: 5.0,  coinsurancePercentage: 100.0 },
  { code: 'COV-BI',    description: 'Pérdida de rentas / BI',                selected: false, deductiblePercentage: 3.0,  coinsurancePercentage: 80.0  },
  { code: 'COV-ELEC',  description: 'Equipo electrónico',                    selected: false, deductiblePercentage: 10.0, coinsurancePercentage: 100.0 },
  { code: 'COV-GLASS', description: 'Vidrios',                               selected: false, deductiblePercentage: 5.0,  coinsurancePercentage: 100.0 },
];
