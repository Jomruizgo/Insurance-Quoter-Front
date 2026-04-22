// Mock state / seed data for Sofka IQ

window.SEED = {
  subscribers: [
    { id: 'SUB-001', name: 'Seguros Sofka' },
    { id: 'SUB-002', name: 'Aseguradora Norte' },
    { id: 'SUB-003', name: 'Andina Seguros' },
  ],
  agents: [
    { code: 'AGT-123', name: 'Juan Pérez', subscriberId: 'SUB-001' },
    { code: 'AGT-124', name: 'María López', subscriberId: 'SUB-001' },
    { code: 'AGT-210', name: 'Carlos Vega', subscriberId: 'SUB-002' },
  ],
  riskClassifications: [
    { code: 'STANDARD',    description: 'Riesgo estándar' },
    { code: 'PREFERRED',   description: 'Riesgo preferente' },
    { code: 'SUBSTANDARD', description: 'Riesgo subestándar' },
  ],
  businessTypes: [
    { code: 'COMMERCIAL', description: 'Comercial' },
    { code: 'INDUSTRIAL', description: 'Industrial' },
    { code: 'RESIDENTIAL',description: 'Residencial' },
  ],
  businessLines: [
    { code: 'BL-001', description: 'Bodega de mercancías',      fireKey: 'FK-INC-01' },
    { code: 'BL-002', description: 'Oficina administrativa',    fireKey: 'FK-INC-02' },
    { code: 'BL-003', description: 'Comercio al menudeo',       fireKey: 'FK-INC-03' },
    { code: 'BL-004', description: 'Planta manufacturera',      fireKey: 'FK-INC-04' },
  ],
  constructionTypes: [
    { code: 'MASONRY',   description: 'Mampostería' },
    { code: 'STEEL',     description: 'Estructura metálica' },
    { code: 'CONCRETE',  description: 'Concreto armado' },
    { code: 'WOOD',      description: 'Madera' },
    { code: 'MIXED',     description: 'Mixto' },
  ],
  guarantees: [
    { code: 'GUA-FIRE',  description: 'Incendio edificios', tarifable: true },
    { code: 'GUA-CONT',  description: 'Incendio contenidos', tarifable: true },
    { code: 'GUA-THEFT', description: 'Robo con violencia', tarifable: true },
    { code: 'GUA-GLASS', description: 'Vidrios', tarifable: true },
    { code: 'GUA-ELEC',  description: 'Equipo electrónico', tarifable: true },
    { code: 'GUA-CASH',  description: 'Dinero y valores', tarifable: true },
  ],
  coverageOptions: [
    { code: 'COV-FIRE',  description: 'Incendio y riesgos adicionales', deductiblePercentage: 2.0, coinsurancePercentage: 80.0, selected: true },
    { code: 'COV-CAT',   description: 'Cobertura catastrófica (CATTEV/CATFHM)', deductiblePercentage: 3.0, coinsurancePercentage: 90.0, selected: true },
    { code: 'COV-THEFT', description: 'Robo con violencia', deductiblePercentage: 5.0, coinsurancePercentage: 100.0, selected: false },
    { code: 'COV-BI',    description: 'Pérdida de rentas / BI', deductiblePercentage: 3.0, coinsurancePercentage: 80.0, selected: false },
    { code: 'COV-ELEC',  description: 'Equipo electrónico', deductiblePercentage: 10.0, coinsurancePercentage: 100.0, selected: true },
    { code: 'COV-GLASS', description: 'Vidrios', deductiblePercentage: 5.0, coinsurancePercentage: 100.0, selected: false },
  ],
  zipDB: {
    '06600': { zipCode: '06600', state: 'Ciudad de México', municipality: 'Cuauhtémoc', city: 'Ciudad de México', neighborhoods: ['Juárez','Tabacalera'], catastrophicZone: 'ZONE_A', tevZone: 'TEV-1', fhmZone: 'FHM-2' },
    '44100': { zipCode: '44100', state: 'Jalisco', municipality: 'Guadalajara', city: 'Guadalajara', neighborhoods: ['Centro','Americana'], catastrophicZone: 'ZONE_B', tevZone: 'TEV-2', fhmZone: 'FHM-1' },
    '64000': { zipCode: '64000', state: 'Nuevo León', municipality: 'Monterrey', city: 'Monterrey', neighborhoods: ['Centro','Obispado'], catastrophicZone: 'ZONE_C', tevZone: 'TEV-3', fhmZone: 'FHM-3' },
  },
  // List of folios for dashboard
  folios: [
    { folioNumber: 'FOL-2026-00042', client: 'Empresa Ejemplo SA de CV', agent: 'AGT-123', agentName: 'Juan Pérez', status: 'IN_PROGRESS',  locations: 3, completion: 75, net: null,    commercial: null,    updatedAt: '2026-04-20T15:35:00Z' },
    { folioNumber: 'FOL-2026-00041', client: 'Textiles Andinos SA',       agent: 'AGT-124', agentName: 'María López', status: 'CALCULATED',   locations: 2, completion: 100, net: 128400.00, commercial: 148944.00, updatedAt: '2026-04-19T11:12:00Z' },
    { folioNumber: 'FOL-2026-00040', client: 'Distribuidora Norte SRL',   agent: 'AGT-210', agentName: 'Carlos Vega',  status: 'ISSUED',       locations: 5, completion: 100, net: 412890.00, commercial: 478952.40, updatedAt: '2026-04-18T09:22:00Z' },
    { folioNumber: 'FOL-2026-00039', client: 'Retail Central SA',         agent: 'AGT-123', agentName: 'Juan Pérez',   status: 'IN_PROGRESS',  locations: 1, completion: 40, net: null,    commercial: null,    updatedAt: '2026-04-18T08:05:00Z' },
    { folioNumber: 'FOL-2026-00038', client: 'Logística del Bajío',       agent: 'AGT-124', agentName: 'María López',  status: 'CREATED',      locations: 0, completion: 10, net: null,    commercial: null,    updatedAt: '2026-04-17T17:40:00Z' },
    { folioNumber: 'FOL-2026-00037', client: 'Manufacturas del Centro',   agent: 'AGT-210', agentName: 'Carlos Vega',  status: 'CALCULATED',   locations: 4, completion: 100, net: 289120.00, commercial: 335379.20, updatedAt: '2026-04-16T14:00:00Z' },
    { folioNumber: 'FOL-2026-00036', client: 'Grupo Alimentos MX',        agent: 'AGT-123', agentName: 'Juan Pérez',   status: 'ISSUED',       locations: 2, completion: 100, net: 95200.00,  commercial: 110432.00, updatedAt: '2026-04-15T10:15:00Z' },
  ],
  // Full quote for FOL-2026-00042 — the one the user edits
  quote: {
    folioNumber: 'FOL-2026-00042',
    quoteStatus: 'IN_PROGRESS',
    insuredData: {
      name: 'Empresa Ejemplo SA de CV',
      rfc: 'EEJ900101ABC',
      email: 'contacto@empresa.com',
      phone: '5512345678',
    },
    underwritingData: {
      agentCode: 'AGT-123',
      subscriberId: 'SUB-001',
      riskClassification: 'STANDARD',
      businessType: 'COMMERCIAL',
    },
    layoutConfiguration: { numberOfLocations: 3, locationType: 'MULTIPLE' },
    coverageOptions: null, // filled from defaults
    locations: [
      {
        index: 1, locationName: 'Bodega Principal',
        address: 'Av. Insurgentes 1000',
        zipCode: '06600', state: 'Ciudad de México', municipality: 'Cuauhtémoc', neighborhood: 'Juárez', city: 'Ciudad de México',
        constructionType: 'MASONRY', level: 2, constructionYear: 1995,
        businessLine: { code: 'BL-001', fireKey: 'FK-INC-01', description: 'Bodega de mercancías' },
        guarantees: [
          { code: 'GUA-FIRE',  insuredValue: 5000000 },
          { code: 'GUA-CONT',  insuredValue: 2000000 },
          { code: 'GUA-THEFT', insuredValue: 500000  },
          { code: 'GUA-ELEC',  insuredValue: 250000  },
        ],
        catastrophicZone: 'ZONE_A',
        validationStatus: 'COMPLETE',
        blockingAlerts: [],
      },
      {
        index: 2, locationName: 'Oficina Sur',
        address: 'Calle Benito Juárez 45',
        zipCode: '', state: '', municipality: '', neighborhood: '', city: '',
        constructionType: 'CONCRETE', level: 4, constructionYear: 2010,
        businessLine: { code: 'BL-002', fireKey: '', description: 'Oficina administrativa' },
        guarantees: [
          { code: 'GUA-FIRE', insuredValue: 1800000 },
        ],
        catastrophicZone: null,
        validationStatus: 'INCOMPLETE',
        blockingAlerts: [
          { code: 'MISSING_ZIP_CODE', message: 'Código postal requerido' },
          { code: 'MISSING_FIRE_KEY', message: 'Clave incendio del giro requerida' },
        ],
      },
      {
        index: 3, locationName: 'Planta Norte',
        address: 'Av. Industrial 890',
        zipCode: '64000', state: 'Nuevo León', municipality: 'Monterrey', neighborhood: 'Centro', city: 'Monterrey',
        constructionType: 'STEEL', level: 1, constructionYear: 2005,
        businessLine: { code: 'BL-004', fireKey: 'FK-INC-04', description: 'Planta manufacturera' },
        guarantees: [
          { code: 'GUA-FIRE',  insuredValue: 12000000 },
          { code: 'GUA-CONT',  insuredValue: 8000000  },
          { code: 'GUA-ELEC',  insuredValue: 1500000  },
          { code: 'GUA-GLASS', insuredValue: 200000   },
        ],
        catastrophicZone: 'ZONE_C',
        validationStatus: 'COMPLETE',
        blockingAlerts: [],
      },
    ],
    netPremium: null,
    commercialPremium: null,
    premiumsByLocation: null,
    calculatedAt: null,
    version: 6,
    updatedAt: '2026-04-20T15:35:00Z',
  },
};

window.STATUS_META = {
  CREATED:     { label: 'Creado',       cls: 'badge',       dot: '#8e8a7e' },
  IN_PROGRESS: { label: 'En progreso',  cls: 'badge-info',  dot: null },
  CALCULATED:  { label: 'Calculado',    cls: 'badge-brand', dot: null },
  ISSUED:      { label: 'Emitido',      cls: 'badge-ok',    dot: null },
};

// Deterministic premium calc for the 3 mock locations — trazable
window.calculatePremiums = function(quote) {
  const tariffs = { fireRate: 0.0015, cattevFactor: 0.0008, catfhmFactor: 0.0005, theftRate: 0.003, electronicEquipmentRate: 0.002, glassRate: 0.0018, bonusFactor: 1.16 };
  const results = [];
  let netTotal = 0;
  for (const loc of quote.locations) {
    if (loc.validationStatus !== 'COMPLETE') {
      results.push({
        index: loc.index, locationName: loc.locationName,
        netPremium: null, commercialPremium: null,
        calculable: false, blockingAlerts: loc.blockingAlerts,
      });
      continue;
    }
    const sumBy = (code) => (loc.guarantees.find(g => g.code === code)?.insuredValue || 0);
    const fire      = sumBy('GUA-FIRE');
    const cont      = sumBy('GUA-CONT');
    const theft     = sumBy('GUA-THEFT');
    const elec      = sumBy('GUA-ELEC');
    const glass     = sumBy('GUA-GLASS');
    const cash      = sumBy('GUA-CASH');

    const fireBuildings = fire * tariffs.fireRate;
    const fireContents  = cont * tariffs.fireRate * 0.85;
    const coverageExt   = (fire + cont) * 0.0003;
    const cattev        = (fire + cont) * tariffs.cattevFactor;
    const catfhm        = (fire + cont) * tariffs.catfhmFactor;
    const debris        = (fire + cont) * 0.0001;
    const extraExp      = (fire) * 0.00005;
    const rentalLoss    = 0;
    const bi            = 0;
    const elecCov       = elec * tariffs.electronicEquipmentRate;
    const theftCov      = theft * tariffs.theftRate;
    const cashCov       = cash * 0.004;
    const glassCov      = glass * tariffs.glassRate;
    const signage       = 0;

    const net = fireBuildings + fireContents + coverageExt + cattev + catfhm + debris + extraExp + rentalLoss + bi + elecCov + theftCov + cashCov + glassCov + signage;
    const commercial = net * tariffs.bonusFactor;
    netTotal += net;

    results.push({
      index: loc.index, locationName: loc.locationName,
      netPremium: +net.toFixed(2),
      commercialPremium: +commercial.toFixed(2),
      calculable: true,
      coverageBreakdown: {
        fireBuildings: +fireBuildings.toFixed(2),
        fireContents:  +fireContents.toFixed(2),
        coverageExtension: +coverageExt.toFixed(2),
        cattev: +cattev.toFixed(2),
        catfhm: +catfhm.toFixed(2),
        debrisRemoval: +debris.toFixed(2),
        extraordinaryExpenses: +extraExp.toFixed(2),
        rentalLoss: +rentalLoss.toFixed(2),
        businessInterruption: +bi.toFixed(2),
        electronicEquipment: +elecCov.toFixed(2),
        theft: +theftCov.toFixed(2),
        cashAndValues: +cashCov.toFixed(2),
        glass: +glassCov.toFixed(2),
        luminousSignage: +signage.toFixed(2),
      },
      blockingAlerts: [],
    });
  }
  return {
    netPremium: +netTotal.toFixed(2),
    commercialPremium: +(netTotal * tariffs.bonusFactor).toFixed(2),
    premiumsByLocation: results,
  };
};

window.fmtMoney = function(v, opts = {}) {
  if (v == null) return '—';
  return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: opts.decimals ?? 2, maximumFractionDigits: opts.decimals ?? 2 });
};
window.fmtPct = function(v) { return v == null ? '—' : `${v.toFixed(1)}%`; };
window.fmtDate = function(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};
