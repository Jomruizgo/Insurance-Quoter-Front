# Plan de Performance — quote-locations (SPEC-007)

> Generado: 2026-04-22
> Spec: `.claude/specs/quote-locations.spec.md`
> Herramienta: k6 (https://k6.io)
> Entorno objetivo: staging (`localhost` en local, sustituir por URLs de staging en CI/CD)

---

## SLAs Definidos

| Endpoint | Método | Servicio | Métrica | Objetivo (P95) | Mínimo Aceptable (P99) | Justificación |
|----------|--------|----------|---------|----------------|------------------------|---------------|
| `/v1/zip-codes/{zipCode}` | GET | core :8081 | Latencia | **300 ms** | 600 ms | El agente espera el auto-fill mientras escribe. Un CP lookup > 300 ms rompe la percepción de respuesta en tiempo real con `debounceTime(400)`. |
| `/v1/quotes/{folio}/locations` | GET | quoter :8080 | Latencia | **500 ms** | 900 ms | Carga inicial de la tabla. Se ejecuta una vez por apertura de la página; tolerable hasta 500 ms. |
| `/v1/quotes/{folio}/locations/{index}` | PATCH | quoter :8080 | Latencia | **800 ms** | 1500 ms | Guardado individual; acción explícita del agente. Hasta 800 ms es aceptable con feedback visual de carga. |
| `/v1/quotes/{folio}/locations` | PUT | quoter :8080 | Latencia | **1000 ms** | 2000 ms | Reemplazo completo; operación poco frecuente y de mayor costo. El agente puede tolerar hasta 1 segundo. |
| `/v1/business-lines` | GET | quoter :8080 | Latencia | **400 ms** | 800 ms | Carga del catálogo de giros; se cachea con `shareReplay(1)`, pero la primera carga es crítica para el primer drawer. |
| Todos los endpoints | — | ambos | Error rate | **< 1%** | — | Tolerancia de error mínima para una aplicación de cotización aseguradora. |

---

## Pruebas Planificadas

| Tipo | Endpoints | VUs | Duración | Trigger CI/CD | Objetivo |
|------|-----------|-----|----------|---------------|----------|
| **Smoke** | Todos los endpoints del feature | 5 | 2 min | En cada PR | Verificar que el ambiente responde y los SLAs no tienen regresión catastrófica |
| **Load** | GET locations, PATCH location, GET zip-code | 100 | 20 min | Pre-release (rama `release/*`) | Simular carga sostenida de 100 agentes trabajando simultáneamente |
| **Soak** | GET zip-code, PATCH location | 50 | 2 horas | Release mayor (merge a `main`) | Detectar memory leaks y degradación gradual (especialmente por `shareReplay` acumulando subscribers) |
| **Spike** | GET zip-code, GET locations | 800 pico | 30 min | Evento especial / campaña | Simular pico de carga extrema (lanzamiento, período de renovación) |
| **Stress** | PATCH location (409 intentional) | 200, subiendo hasta fallo | Hasta degradación | Manual / bajo demanda | Encontrar el punto de quiebre del control de versión optimista bajo alta concurrencia |

---

## Ambiente y Datos de Prueba

### Requisitos del ambiente

- Backend quoter corriendo en `http://localhost:8080` (o URL de staging configurada en variable `BASE_URL`)
- Backend core corriendo en `http://localhost:8081` (o URL de staging configurada en variable `CORE_URL`)
- Base de datos PostgreSQL con al menos **500 folios de prueba** con layout configurado (SPEC-006 completado)
- Cada folio debe tener entre 1 y 5 ubicaciones parcialmente configuradas para simular escenarios reales

### Datos de prueba

```javascript
// fixture: test-data.js
export const TEST_FOLIOS = [
  'FOL-PERF-001', 'FOL-PERF-002', 'FOL-PERF-003',
  // ... hasta FOL-PERF-500 generados por script de seed
];

export const VALID_ZIP_CODES = ['06600', '11000', '01210', '64000', '44100'];
export const INVALID_ZIP_CODE = '99999';

export const LOCATION_PATCH_PAYLOAD = {
  locationName: 'Bodega de Prueba Performance',
  address: 'Av. Test 1000',
  zipCode: '06600',
  constructionType: 'MASONRY',
  level: 3,
  constructionYear: 2000,
  guarantees: [
    { code: 'GUA-FIRE', insuredValue: 5000000 },
    { code: 'GUA-CONT', insuredValue: 2000000 },
    { code: 'GUA-THEFT', insuredValue: 0 },
    { code: 'GUA-GLASS', insuredValue: 0 },
    { code: 'GUA-ELEC', insuredValue: 0 },
    { code: 'GUA-CASH', insuredValue: 0 }
  ],
  version: 1
};
```

### Script de seed de base de datos

Antes de ejecutar las pruebas de Load y Soak, ejecutar el script de seed:

```bash
# Crear 500 folios con layout configurado y versión inicial
cd Insurance-Quoter-Back
./gradlew test -Dtest=PerformanceSeedTask --info
# O mediante el endpoint de seed del perfil 'test'
curl -X POST http://localhost:8080/internal/seed/locations-performance \
  -H "Content-Type: application/json" \
  -d '{"folioCount": 500, "locationsPerFolio": 3}'
```

---

## Scripts k6

### Smoke Test — Verificación básica de endpoints

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '2m',
  thresholds: {
    'http_req_duration{endpoint:get_locations}': ['p(95)<500'],
    'http_req_duration{endpoint:patch_location}': ['p(95)<800'],
    'http_req_duration{endpoint:get_zip_code}': ['p(95)<300'],
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const CORE_URL = __ENV.CORE_URL || 'http://localhost:8081';
const TEST_FOLIO = 'FOL-PERF-001';

export default function () {
  // GET locations
  const locRes = http.get(
    `${BASE_URL}/v1/quotes/${TEST_FOLIO}/locations`,
    { tags: { endpoint: 'get_locations' } }
  );
  check(locRes, {
    'GET locations status 200': (r) => r.status === 200,
    'GET locations has locations array': (r) => JSON.parse(r.body).locations !== undefined,
  });

  sleep(0.5);

  // PATCH individual location
  const patchPayload = JSON.stringify({
    locationName: 'Smoke Test Location',
    version: JSON.parse(locRes.body).version,
  });
  const patchRes = http.patch(
    `${BASE_URL}/v1/quotes/${TEST_FOLIO}/locations/1`,
    patchPayload,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'patch_location' },
    }
  );
  check(patchRes, {
    'PATCH location status 200 or 409': (r) => r.status === 200 || r.status === 409,
  });

  sleep(0.4); // simula debounceTime del CP lookup

  // GET zip-code lookup (core)
  const cpRes = http.get(
    `${CORE_URL}/v1/zip-codes/06600`,
    { tags: { endpoint: 'get_zip_code' } }
  );
  check(cpRes, {
    'GET zip-code status 200': (r) => r.status === 200,
    'GET zip-code has state field': (r) => JSON.parse(r.body).state !== undefined,
  });

  sleep(1);
}
```

---

### Load Test — Operaciones de Ubicaciones (100 VUs sostenidos)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const errorRate = new Rate('errors');
const zipLookupTrend = new Trend('zip_lookup_duration', true);
const patchLocationTrend = new Trend('patch_location_duration', true);

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // warm-up
    { duration: '3m', target: 100 },  // ramp-up hasta carga objetivo
    { duration: '12m', target: 100 }, // sostenido
    { duration: '3m', target: 0 },    // ramp-down
  ],
  thresholds: {
    'http_req_duration{endpoint:get_locations}': ['p(95)<500'],
    'http_req_duration{endpoint:patch_location}': ['p(95)<800'],
    'http_req_duration{endpoint:get_zip_code}': ['p(95)<300'],
    'http_req_duration{endpoint:put_locations}': ['p(95)<1000'],
    'http_req_duration{endpoint:get_business_lines}': ['p(95)<400'],
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const CORE_URL = __ENV.CORE_URL || 'http://localhost:8081';

const TEST_FOLIOS = Array.from({ length: 500 }, (_, i) =>
  `FOL-PERF-${String(i + 1).padStart(3, '0')}`
);
const VALID_ZIP_CODES = ['06600', '11000', '01210', '64000', '44100'];

export default function () {
  const folio = randomItem(TEST_FOLIOS);
  const zipCode = randomItem(VALID_ZIP_CODES);

  // 1. Cargar lista de ubicaciones (simula apertura de la página)
  const locRes = http.get(
    `${BASE_URL}/v1/quotes/${folio}/locations`,
    { tags: { endpoint: 'get_locations' } }
  );
  const locOk = check(locRes, {
    'GET locations 200': (r) => r.status === 200,
  });
  errorRate.add(!locOk);

  let currentVersion = 1;
  if (locRes.status === 200) {
    currentVersion = JSON.parse(locRes.body).version ?? 1;
  }

  sleep(0.8); // tiempo de lectura de la tabla

  // 2. CP lookup (simula el agente escribiendo en el drawer — con debounce 400ms)
  sleep(0.4);
  const cpStart = Date.now();
  const cpRes = http.get(
    `${CORE_URL}/v1/zip-codes/${zipCode}`,
    { tags: { endpoint: 'get_zip_code' } }
  );
  zipLookupTrend.add(Date.now() - cpStart);
  const cpOk = check(cpRes, {
    'GET zip-code 200': (r) => r.status === 200,
  });
  errorRate.add(!cpOk);

  sleep(1.5); // tiempo de completar el formulario del drawer

  // 3. Cargar catálogo de giros (primera apertura del drawer en cada sesión)
  if (__ITER % 10 === 0) { // solo 1 de cada 10 VUs para simular shareReplay
    const blRes = http.get(
      `${BASE_URL}/v1/business-lines`,
      { tags: { endpoint: 'get_business_lines' } }
    );
    check(blRes, {
      'GET business-lines 200': (r) => r.status === 200,
    });
  }

  // 4. Guardar ubicación individual (PATCH)
  const patchPayload = JSON.stringify({
    locationName: `Bodega Load Test VU${__VU}`,
    zipCode: zipCode,
    constructionType: 'MASONRY',
    level: 2,
    constructionYear: 2000,
    guarantees: [
      { code: 'GUA-FIRE', insuredValue: 5000000 },
      { code: 'GUA-CONT', insuredValue: 0 },
      { code: 'GUA-THEFT', insuredValue: 0 },
      { code: 'GUA-GLASS', insuredValue: 0 },
      { code: 'GUA-ELEC', insuredValue: 0 },
      { code: 'GUA-CASH', insuredValue: 0 }
    ],
    version: currentVersion,
  });

  const patchStart = Date.now();
  const patchRes = http.patch(
    `${BASE_URL}/v1/quotes/${folio}/locations/1`,
    patchPayload,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'patch_location' },
    }
  );
  patchLocationTrend.add(Date.now() - patchStart);

  // 409 es esperado bajo carga concurrente — no se cuenta como error
  const patchOk = check(patchRes, {
    'PATCH location 200 o 409': (r) => r.status === 200 || r.status === 409,
  });
  errorRate.add(!patchOk);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'docs/output/qa/load-test-results.json': JSON.stringify(data),
  };
}
```

---

### Soak Test — Resistencia CP Lookup (sesión larga de 2 horas)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const errorRate = new Rate('soak_errors');
const p95Tracker = new Trend('soak_zip_p95', true);

export const options = {
  stages: [
    { duration: '5m', target: 50 },    // warm-up lento
    { duration: '110m', target: 50 },  // sostenido 2 horas menos warm-up/down
    { duration: '5m', target: 0 },     // ramp-down
  ],
  thresholds: {
    'http_req_duration{endpoint:get_zip_code}': ['p(95)<300'],
    'http_req_duration{endpoint:patch_location}': ['p(95)<800'],
    'soak_errors': ['rate<0.01'],
    // Umbral de degradación: si P95 supera 1.5x el SLA a la hora 1, se falla el test
    'http_req_duration{endpoint:get_zip_code,stage:sustained}': ['p(95)<450'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const CORE_URL = __ENV.CORE_URL || 'http://localhost:8081';

const TEST_FOLIOS = Array.from({ length: 500 }, (_, i) =>
  `FOL-PERF-${String(i + 1).padStart(3, '0')}`
);
const VALID_ZIP_CODES = ['06600', '11000', '01210', '64000', '44100'];

export default function () {
  const folio = randomItem(TEST_FOLIOS);
  const zipCode = randomItem(VALID_ZIP_CODES);

  // Simula el ciclo completo de un agente: abrir drawer → escribir CP → guardar
  sleep(0.4); // debounceTime

  const cpRes = http.get(
    `${CORE_URL}/v1/zip-codes/${zipCode}`,
    { tags: { endpoint: 'get_zip_code', stage: 'sustained' } }
  );
  p95Tracker.add(cpRes.timings.duration);

  const cpOk = check(cpRes, {
    'Soak: GET zip-code 200': (r) => r.status === 200,
    'Soak: zip-code latencia < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(!cpOk);

  sleep(2);

  // PATCH location simulando guardado periódico
  const locRes = http.get(
    `${BASE_URL}/v1/quotes/${folio}/locations`,
    { tags: { endpoint: 'get_locations' } }
  );

  if (locRes.status === 200) {
    const version = JSON.parse(locRes.body).version ?? 1;
    const patchRes = http.patch(
      `${BASE_URL}/v1/quotes/${folio}/locations/1`,
      JSON.stringify({ locationName: `Soak VU${__VU} iter${__ITER}`, version }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'patch_location' },
      }
    );
    check(patchRes, {
      'Soak: PATCH 200 o 409': (r) => r.status === 200 || r.status === 409,
    });
  }

  sleep(3);
}
```

---

### Spike Test — Pico de carga extrema en CP Lookup

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const errorRate = new Rate('spike_errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // base normal
    { duration: '1m', target: 800 },  // spike abrupto
    { duration: '5m', target: 800 },  // sostenido en pico
    { duration: '2m', target: 100 },  // recuperación
    { duration: '5m', target: 100 },  // verificar recuperación
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // Durante el pico se relajan los SLAs, pero deben recuperarse
    'http_req_duration{endpoint:get_zip_code,stage:recovery}': ['p(95)<600'],
    'spike_errors': ['rate<0.05'], // se tolera hasta 5% de error en el pico
  },
};

const CORE_URL = __ENV.CORE_URL || 'http://localhost:8081';
const VALID_ZIP_CODES = ['06600', '11000', '01210', '64000', '44100'];

function getStage() {
  const elapsed = Date.now() / 1000;
  if (elapsed < 180) return 'base';
  if (elapsed < 540) return 'spike';
  return 'recovery';
}

export default function () {
  const zipCode = randomItem(VALID_ZIP_CODES);
  const stage = getStage();

  sleep(0.4); // simula debounceTime del campo CP

  const cpRes = http.get(
    `${CORE_URL}/v1/zip-codes/${zipCode}`,
    { tags: { endpoint: 'get_zip_code', stage } }
  );

  const ok = check(cpRes, {
    [`Spike [${stage}]: GET zip-code responde`]: (r) =>
      r.status === 200 || r.status === 503,
    [`Spike [${stage}]: no timeout`]: (r) => r.timings.duration < 10000,
  });
  errorRate.add(cpRes.status >= 500 && cpRes.status !== 503);

  sleep(0.5);
}
```

---

### Stress Test — Control de versión optimista bajo alta concurrencia

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const conflictCount = new Counter('version_conflicts_409');
const errorRate = new Rate('stress_errors');

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '3m', target: 200 },
    { duration: '3m', target: 300 },
    { duration: '3m', target: 400 },  // continúa hasta que se detecte degradación
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.10'],  // hasta 10% de error se considera "informativo" en stress
    'stress_errors': ['rate<0.20'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
// Todos los VUs atacan el mismo folio para maximizar conflictos de versión
const STRESS_FOLIO = 'FOL-PERF-STRESS';

export default function () {
  // Leer versión actual
  const locRes = http.get(`${BASE_URL}/v1/quotes/${STRESS_FOLIO}/locations`);
  let version = 1;
  if (locRes.status === 200) {
    version = JSON.parse(locRes.body).version ?? 1;
  }

  // Intentar PATCH con la versión leída (puede generar 409 si otro VU ya actualizó)
  const patchRes = http.patch(
    `${BASE_URL}/v1/quotes/${STRESS_FOLIO}/locations/1`,
    JSON.stringify({
      locationName: `Stress VU${__VU}`,
      version,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (patchRes.status === 409) {
    conflictCount.add(1);
  }

  const ok = check(patchRes, {
    'Stress: PATCH no falla con 5xx': (r) => r.status < 500,
    'Stress: respuesta parseable': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });
  errorRate.add(!ok);

  sleep(0.5);
}

export function handleSummary(data) {
  const conflicts = data.metrics.version_conflicts_409?.values?.count ?? 0;
  const totalReqs = data.metrics.http_reqs?.values?.count ?? 0;
  console.log(`Conflictos 409: ${conflicts} de ${totalReqs} peticiones (${((conflicts/totalReqs)*100).toFixed(1)}%)`);
  return {
    'docs/output/qa/stress-test-results.json': JSON.stringify(data),
  };
}
```

---

## Integración CI/CD

```yaml
# .github/workflows/performance.yml (extracto)
performance-smoke:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
    - name: Run k6 smoke test
      uses: grafana/k6-action@v0.3.1
      with:
        filename: docs/output/qa/scripts/k6-smoke.js
      env:
        BASE_URL: ${{ secrets.STAGING_QUOTER_URL }}
        CORE_URL: ${{ secrets.STAGING_CORE_URL }}

performance-load:
  runs-on: ubuntu-latest
  if: startsWith(github.ref, 'refs/heads/release/')
  steps:
    - uses: actions/checkout@v4
    - name: Run k6 load test
      uses: grafana/k6-action@v0.3.1
      with:
        filename: docs/output/qa/scripts/k6-load.js
      env:
        BASE_URL: ${{ secrets.STAGING_QUOTER_URL }}
        CORE_URL: ${{ secrets.STAGING_CORE_URL }}
```

---

## Análisis de riesgos de performance específicos de este feature

| Riesgo | Endpoint afectado | Probabilidad | Mitigación |
|--------|-------------------|-------------|------------|
| CP lookup se dispara por cada VU en el Load Test — el core puede saturarse antes que el quoter | `GET /v1/zip-codes/{zipCode}` | Alta | Usar `shareReplay` o caché local en `ZipCodeService` para CPs ya consultados en la sesión |
| `PUT /v1/quotes/{folio}/locations` con 100 garantías activas puede superar el SLA de 1s si el backend recalcula la prima en el mismo request | `PUT /v1/quotes/{folio}/locations` | Media | Validar con el equipo de backend si el cálculo de prima es síncrono o asíncrono en este endpoint |
| `shareReplay(1)` en `CatalogService` elimina peticiones repetidas al catálogo, pero si hay 500 VUs cada uno en su primera sesión, generan 500 peticiones simultáneas al iniciar | `GET /v1/business-lines` | Baja (se mitiga con warm-up gradual) | El `shareReplay` es por instancia Angular (un proceso cliente), no por servidor. El servidor sí recibe N peticiones simultáneas. Considerar caché HTTP de corta duración en el backend (ETag o `Cache-Control: max-age=300`). |

---

## Interpretación de resultados

| Indicador | Verde | Amarillo | Rojo |
|-----------|-------|----------|------|
| CP lookup P95 | < 300 ms | 300–450 ms | > 450 ms |
| PATCH location P95 | < 800 ms | 800 ms–1.2 s | > 1.2 s |
| GET locations P95 | < 500 ms | 500 ms–750 ms | > 750 ms |
| PUT locations P95 | < 1000 ms | 1–1.5 s | > 1.5 s |
| Error rate | < 0.5% | 0.5–1% | > 1% |
| Conflictos 409 en Stress | Informativo | — | 5xx en lugar de 409 = bug |

Un resultado **Amarillo** no bloquea el release pero requiere un plan de optimización documentado en el GitHub Issue correspondiente. Un resultado **Rojo** en cualquier SLA de P95 bloquea el merge a `main`.
