export type LocationType = 'SINGLE' | 'MULTIPLE';

export interface LayoutConfiguration {
  numberOfLocations: number;
  locationType: LocationType;
}

export interface LayoutConfigResponse {
  folioNumber: string;
  layoutConfiguration: LayoutConfiguration;
  version: number;
  updatedAt?: string;
}

export interface SaveLayoutConfigRequest {
  layoutConfiguration: LayoutConfiguration;
  version: number;
}
