export interface ZipCodeInfo {
  zipCode: string;
  state: string;
  municipality: string;
  city: string;
  neighborhoods: string[];
  catastrophicZone: string;
  tevZone: string;
  fhmZone: string;
  valid: boolean;
}
