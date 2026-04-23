export interface CalculationRequest {
  version: number;
}

export interface BlockingAlert {
  code: string;
  message: string;
}

export interface CoverageBreakdown {
  fireBuildings: number;
  fireContents: number;
  coverageExtension: number;
  cattev: number;
  catfhm: number;
  debrisRemoval: number;
  extraordinaryExpenses: number;
  rentalLoss: number;
  businessInterruption: number;
  electronicEquipment: number;
  theft: number;
  cashAndValues: number;
  glass: number;
  luminousSignage: number;
}

export interface LocationPremium {
  index: number;
  locationName: string;
  netPremium: number | null;
  commercialPremium: number | null;
  calculable: boolean;
  coverageBreakdown?: CoverageBreakdown;
  blockingAlerts: BlockingAlert[];
}

export interface CalculationResult {
  folioNumber: string;
  quoteStatus: 'CALCULATED';
  netPremium: number;
  commercialPremium: number;
  premiumsByLocation: LocationPremium[];
  calculatedAt: string;
  version: number;
}

export const TECHNICAL_COMPONENTS: { key: keyof CoverageBreakdown; label: string }[] = [
  { key: 'fireBuildings',         label: 'Incendio edificios' },
  { key: 'fireContents',          label: 'Incendio contenidos' },
  { key: 'coverageExtension',     label: 'Extensión de cobertura' },
  { key: 'cattev',                label: 'CATTEV' },
  { key: 'catfhm',                label: 'CATFHM' },
  { key: 'debrisRemoval',         label: 'Remoción de escombros' },
  { key: 'extraordinaryExpenses', label: 'Gastos extraordinarios' },
  { key: 'rentalLoss',            label: 'Pérdida de rentas' },
  { key: 'businessInterruption',  label: 'BI' },
  { key: 'electronicEquipment',   label: 'Equipo electrónico' },
  { key: 'theft',                 label: 'Robo' },
  { key: 'cashAndValues',         label: 'Dinero y valores' },
  { key: 'glass',                 label: 'Vidrios' },
  { key: 'luminousSignage',       label: 'Anuncios luminosos' },
];
