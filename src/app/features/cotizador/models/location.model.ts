import { BusinessLine } from './catalog.model';

export type ConstructionType = 'MASONRY' | 'STEEL' | 'CONCRETE' | 'WOOD' | 'MIXED';
export type ValidationStatus = 'COMPLETE' | 'INCOMPLETE';

export interface BlockingAlert {
  code: string;
  message: string;
}

export interface Guarantee {
  code: string;
  insuredValue: number;
}

export interface Location {
  index: number;
  locationName: string;
  address: string;
  zipCode: string;
  state?: string;
  municipality?: string;
  city?: string;
  neighborhood?: string;
  catastrophicZone?: string;
  tevZone?: string;
  fhmZone?: string;
  constructionType: ConstructionType;
  level: number;
  constructionYear: number;
  businessLine: BusinessLine | null;
  guarantees: Guarantee[];
  validationStatus: ValidationStatus;
  blockingAlerts: BlockingAlert[];
}

export interface LocationSummaryItem {
  index: number;
  locationName: string;
  validationStatus: ValidationStatus;
  blockingAlerts: BlockingAlert[];
}

export interface LocationsResponse {
  folioNumber: string;
  locations: Location[];
  version: number;
}

export interface LocationResponse {
  folioNumber: string;
  location: Location;
  updatedAt: string;
  version: number;
}

export interface LocationsSummary {
  folioNumber: string;
  totalLocations: number;
  completeLocations: number;
  incompleteLocations: number;
  locations: LocationSummaryItem[];
}

export interface LocationPatchRequest {
  locationName?: string;
  address?: string;
  zipCode?: string;
  neighborhood?: string;
  constructionType?: ConstructionType;
  level?: number;
  constructionYear?: number;
  businessLine?: { code: string; fireKey: string } | null;
  guarantees?: Guarantee[];
  version: number;
}
