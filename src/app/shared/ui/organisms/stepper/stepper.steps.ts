import { StepDefinition } from '../../../../core/models/folio.model';

export const QUOTE_STEPS: StepDefinition[] = [
  { key: 'generalInfo',     label: 'Datos generales', route: 'general-info' },
  { key: 'layout',          label: 'Layout',          route: 'layout' },
  { key: 'locations',       label: 'Ubicaciones',     route: 'locations' },
  { key: 'coverageOptions', label: 'Coberturas',      route: 'technical-info' },
  { key: 'calculation',     label: 'Cálculo',         route: 'terms-and-conditions' },
];
