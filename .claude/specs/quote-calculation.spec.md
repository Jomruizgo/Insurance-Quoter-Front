---
id: SPEC-009
status: IMPLEMENTED
feature: quote-calculation
created: 2026-04-23
updated: 2026-04-23
author: spec-generator
version: "1.0"
related-specs:
  - SPEC-008  # quote-coverages (paso 4, fuente de ubicaciones y su validationStatus)
  - SPEC-006  # app-shell (StatusBar que se actualiza con quoteStatus)
---

# Spec: Cálculo de Prima (Paso 5/5)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Paso 5 y último del wizard de cotización. El agente ejecuta el cálculo de prima para el folio y visualiza el desglose financiero completo por componente técnico y por ubicación. La pantalla tiene dos estados excluyentes:

- **Estado A — Pre-cálculo:** disparador con resumen de ubicaciones calculables.
- **Estado B — Resultado:** desglose financiero con prima neta, prima comercial y tabla de componentes técnicos por ubicación.

Las ubicaciones con `validationStatus !== 'COMPLETE'` no bloquean el cálculo de las COMPLETE; generan alerta visible y badge de advertencia. La pantalla es el paso previo a la aceptación de términos y condiciones (FE-09).

### Requerimiento de Negocio

El cotizador necesita exponer al agente el resultado financiero del folio desglosado por los 14 componentes técnicos de la tarifa de daños antes de emitir la póliza. El cálculo lo realiza el backend; el frontend únicamente dispara la petición, muestra el resultado y actualiza el estado del folio en el StatusBar.

### Historias de Usuario

#### HU-01: Disparar el cálculo de prima

```
Como:        Agente de cotización
Quiero:      Ver un resumen de ubicaciones calculables y ejecutar el cálculo con un click
Para:        Obtener la prima neta y comercial del folio antes de continuar a términos

Prioridad:   Alta
Estimación:  3 puntos
```

#### HU-02: Visualizar el desglose financiero

```
Como:        Agente de cotización
Quiero:      Ver la prima neta, prima comercial y su desglose por los 14 componentes técnicos
             para cada ubicación calculable
Para:        Validar el resultado antes de aceptar los términos y condiciones

Prioridad:   Alta
Estimación:  3 puntos
```

#### HU-03: Identificar ubicaciones no calculables

```
Como:        Agente de cotización
Quiero:      Ver cuáles ubicaciones no pudieron calcularse y por qué
Para:        Corregir los datos faltantes si es necesario o continuar con las calculables

Prioridad:   Media
Estimación:  1 punto
```

### Criterios de Aceptación (Gherkin)

```gherkin
Feature: Cálculo de prima del folio

  Background:
    Given el agente está autenticado en el sistema
    And existe el folio "FOL-2026-00042" con version 7

  # --- Estado A: Pre-cálculo ---

  Scenario: Visualizar estado pre-cálculo con todas las ubicaciones completas
    Given el folio tiene 3 ubicaciones todas con validationStatus "COMPLETE"
    When el agente navega a /quotes/FOL-2026-00042/technical-info
    Then ve el CalculationTriggerComponent con:
      | campo             | valor                          |
      | mensaje           | "Se calcularán 3 ubicaciones completas." |
      | badge calculables | "3 calculables" en verde       |
      | badge alertas     | no visible                     |
      | botón             | "Ejecutar cálculo" habilitado  |

  Scenario: Visualizar estado pre-cálculo con ubicaciones mixtas
    Given el folio tiene 2 ubicaciones COMPLETE y 1 INCOMPLETE
    When el agente navega a /quotes/FOL-2026-00042/technical-info
    Then ve el mensaje "Se calcularán 2 ubicaciones completas. Las 1 incompletas generarán alerta pero no bloquearán el proceso."
    And ve badge "2 calculables" en verde
    And ve badge "1 con alertas" en amarillo
    And el botón "Ejecutar cálculo" está habilitado

  Scenario: Botón deshabilitado si no hay ubicaciones calculables
    Given el folio tiene 2 ubicaciones ambas con validationStatus "INCOMPLETE"
    When el agente navega a /quotes/FOL-2026-00042/technical-info
    Then el botón "Ejecutar cálculo" está deshabilitado

  # --- Ejecución del cálculo ---

  Scenario: Ejecutar cálculo exitoso con todas las ubicaciones completas
    Given el folio tiene 2 ubicaciones COMPLETE
    When el agente hace click en "Ejecutar cálculo"
    Then el sistema llama POST /v1/quotes/FOL-2026-00042/calculate con body {"version": 7}
    And la pantalla muestra el spinner de carga durante la petición
    And al recibir respuesta 200 se muestra el Estado B (desglose financiero)
    And el StatusBar refleja quoteStatus "CALCULATED"

  Scenario: Error 422 — todas las ubicaciones incompletas
    Given el backend retorna 422 con code "NO_CALCULABLE_LOCATIONS"
    When el agente hace click en "Ejecutar cálculo"
    Then se muestra un mensaje de error: "No hay ubicaciones calculables. Completa al menos una ubicación antes de calcular."
    And el botón "Ejecutar cálculo" permanece visible y habilitado para reintentar

  Scenario: Error 409 — conflicto de versión
    Given el backend retorna 409 con code "VERSION_CONFLICT"
    When el agente hace click en "Ejecutar cálculo"
    Then se muestra un mensaje de error: "El folio fue modificado por otro usuario. Recarga la página para continuar."

  # --- Estado B: Resultado del cálculo ---

  Scenario: Visualizar resumen de primas (3 cards)
    Given el cálculo retornó netPremium 48500.00 y commercialPremium 56260.00
    When el Estado B es visible
    Then la card oscura muestra "Prima neta" con valor "MXN 48,500.00"
    And la card primaria muestra "Prima comercial" con valor "MXN 56,260.00"
    And la card neutral muestra la lista de ubicaciones con su prima comercial o badge "No calculable"

  Scenario: Prima comercial siempre igual a neta × 1.16
    Given netPremium es 48500.00
    Then commercialPremium visible es exactamente 56260.00 (48500 × 1.16)

  Scenario: Tabla de desglose muestra "—" para primas cero o nulas
    Given la ubicación "Bodega" tiene fireBuildings 20000.00 y rentalLoss 0.00
    When se muestra el PremiumBreakdownTableComponent
    Then la celda Incendio edificios muestra "MXN 20,000.00"
    And la celda Pérdida de rentas muestra "—" en color muted
    And la fila "Prima neta por ubicación" muestra los totales en bold

  Scenario: Alerta de ubicaciones no calculables
    Given el resultado tiene 1 ubicación no calculable con alerta "Código postal requerido"
    When el Estado B es visible
    Then el IncompleteLocationsAlertComponent es visible con tipo "warn"
    And lista "Oficina Sur: Código postal requerido"

  Scenario: Sin ubicaciones incompletas — alerta oculta
    Given todas las ubicaciones son calculables
    When el Estado B es visible
    Then el IncompleteLocationsAlertComponent no es visible

  # --- Acciones de cabecera ---

  Scenario: Continuar a términos y condiciones
    Given quoteStatus es "CALCULATED"
    When el agente hace click en "Continuar a términos y condiciones"
    Then el router navega a /quotes/FOL-2026-00042/terms-and-conditions

  Scenario: Botón continuar deshabilitado si quoteStatus !== CALCULATED
    Given quoteStatus es "IN_PROGRESS"
    When el Estado A es visible
    Then el botón "Continuar a términos y condiciones" no está visible o está deshabilitado

  Scenario: Recalcular desde el resultado
    Given el Estado B está visible
    When el agente hace click en "Recalcular"
    Then la pantalla vuelve al Estado A (CalculationTriggerComponent)
    And los datos de cálculo previo se limpian del estado local
```

### Reglas de Negocio

| ID | Regla |
|----|-------|
| RN-01 | `commercialPremium = netPremium × 1.16` — siempre calculado por el backend; el frontend solo lo muestra. |
| RN-02 | Una ubicación es calculable si `validationStatus === 'COMPLETE'`; de lo contrario es incompleta y genera `blockingAlerts`. |
| RN-03 | Si ALL las ubicaciones son incompletas, el backend retorna 422 `NO_CALCULABLE_LOCATIONS`. El frontend muestra error y no oculta el disparador. |
| RN-04 | El botón "Ejecutar cálculo" se deshabilita cuando no hay ninguna ubicación calculable en el folio actual (calculables === 0). |
| RN-05 | Valores `0` o `null` en `coverageBreakdown` se muestran como `"—"` con `color: var(--text-mute)`. |
| RN-06 | El botón "Continuar a términos y condiciones" solo se habilita cuando `quoteStatus === 'CALCULATED'`. |
| RN-07 | Tras un cálculo exitoso se llama `QuoteStateService.refresh()` para que el StatusBar del Shell actualice el estado. |
| RN-08 | La columna "Total" de la tabla de desglose suma los valores de todas las ubicaciones CALCULABLE únicamente. |
| RN-09 | "Recalcular" vuelve al Estado A limpiando el resultado local; no llama automáticamente a la API. |

---

## 2. DISEÑO

### 2.1 Modelos TypeScript

**Archivo:** `src/app/features/cotizador/models/calculation.model.ts`

```typescript
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
  { key: 'fireBuildings',          label: 'Incendio edificios' },
  { key: 'fireContents',           label: 'Incendio contenidos' },
  { key: 'coverageExtension',      label: 'Extensión de cobertura' },
  { key: 'cattev',                 label: 'CATTEV' },
  { key: 'catfhm',                 label: 'CATFHM' },
  { key: 'debrisRemoval',          label: 'Remoción de escombros' },
  { key: 'extraordinaryExpenses',  label: 'Gastos extraordinarios' },
  { key: 'rentalLoss',             label: 'Pérdida de rentas' },
  { key: 'businessInterruption',   label: 'BI' },
  { key: 'electronicEquipment',    label: 'Equipo electrónico' },
  { key: 'theft',                  label: 'Robo' },
  { key: 'cashAndValues',          label: 'Dinero y valores' },
  { key: 'glass',                  label: 'Vidrios' },
  { key: 'luminousSignage',        label: 'Anuncios luminosos' },
];
```

### 2.2 Endpoint de API

**Sección:** api-contracts.md § 7 — Cálculo de Prima

#### POST /v1/quotes/{folio}/calculate

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Ruta | `/v1/quotes/{folio}/calculate` |
| Auth | Bearer token (si aplica) |

**Request body:**
```json
{ "version": 7 }
```

**Response 200:**
```json
{
  "folioNumber": "FOL-2026-00042",
  "quoteStatus": "CALCULATED",
  "netPremium": 48500.00,
  "commercialPremium": 56260.00,
  "premiumsByLocation": [
    {
      "index": 1,
      "locationName": "Bodega Principal",
      "netPremium": 48500.00,
      "commercialPremium": 56260.00,
      "calculable": true,
      "coverageBreakdown": {
        "fireBuildings": 20000.00,
        "fireContents": 15000.00,
        "coverageExtension": 3500.00,
        "cattev": 4000.00,
        "catfhm": 2500.00,
        "debrisRemoval": 1500.00,
        "extraordinaryExpenses": 1000.00,
        "rentalLoss": 0.00,
        "businessInterruption": 0.00,
        "electronicEquipment": 500.00,
        "theft": 0.00,
        "cashAndValues": 0.00,
        "glass": 0.00,
        "luminousSignage": 0.00
      },
      "blockingAlerts": []
    },
    {
      "index": 2,
      "locationName": "Oficina Sur",
      "netPremium": null,
      "commercialPremium": null,
      "calculable": false,
      "blockingAlerts": [
        { "code": "MISSING_ZIP_CODE", "message": "Código postal requerido" }
      ]
    }
  ],
  "calculatedAt": "2026-04-20T16:00:00Z",
  "version": 8
}
```

**Response 409:**
```json
{ "error": "Optimistic lock conflict", "code": "VERSION_CONFLICT" }
```

**Response 422:**
```json
{ "error": "No calculable locations", "code": "NO_CALCULABLE_LOCATIONS" }
```

### 2.3 Service — `CalculationService`

**Archivo:** `src/app/features/cotizador/services/calculation.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class CalculationService {
  calculate(folio: string, version: number): Observable<CalculationResult>
  // POST /v1/quotes/{folio}/calculate
  // body: { version }
  // Propaga HttpErrorResponse para que el componente maneje 409/422
}
```

**Test:** `src/app/features/cotizador/services/calculation.service.spec.ts`

Casos de test requeridos (TDD):
1. `calculate()` hace POST a la URL correcta con el body `{ version }`
2. Retorna `Observable<CalculationResult>` en respuesta 200
3. Propaga el error en respuesta 409 con `code: VERSION_CONFLICT`
4. Propaga el error en respuesta 422 con `code: NO_CALCULABLE_LOCATIONS`

### 2.4 Diseño de Componentes (Atomic Design)

#### Ruta de la página

```
/quotes/:folio/technical-info  →  CalculationPage
```

#### Árbol de componentes

```
CalculationPage (Page)
├── [Estado A] CalculationTriggerComponent (Organism)   ← exclusive con Estado B
│   └── BadgeComponent (Atom)                           ← ya existe en shared/ui/atoms/
└── [Estado B] Resultado del cálculo
    ├── PremiumSummaryComponent (Organism)
    │   ├── BadgeComponent (Atom)
    │   └── [lista de ubicaciones por prima]
    ├── PremiumBreakdownTableComponent (Organism)
    │   └── [tabla de 14 componentes × N ubicaciones]
    └── IncompleteLocationsAlertComponent (Molecule)    ← solo si hay incompletas
```

#### Archivos a crear

| Artefacto | Ruta |
|-----------|------|
| Modelo | `src/app/features/cotizador/models/calculation.model.ts` |
| Service | `src/app/features/cotizador/services/calculation.service.ts` |
| Service test | `src/app/features/cotizador/services/calculation.service.spec.ts` |
| Page | `src/app/features/cotizador/pages/calculation/calculation.page.ts` |
| Page HTML | `src/app/features/cotizador/pages/calculation/calculation.page.html` |
| Page SCSS | `src/app/features/cotizador/pages/calculation/calculation.page.scss` |
| Organism trigger | `src/app/features/cotizador/components/calculation-trigger/calculation-trigger.component.ts` |
| Organism trigger HTML | `src/app/features/cotizador/components/calculation-trigger/calculation-trigger.component.html` |
| Organism trigger SCSS | `src/app/features/cotizador/components/calculation-trigger/calculation-trigger.component.scss` |
| Organism summary | `src/app/features/cotizador/components/premium-summary/premium-summary.component.ts` |
| Organism summary HTML | `src/app/features/cotizador/components/premium-summary/premium-summary.component.html` |
| Organism summary SCSS | `src/app/features/cotizador/components/premium-summary/premium-summary.component.scss` |
| Organism table | `src/app/features/cotizador/components/premium-breakdown-table/premium-breakdown-table.component.ts` |
| Organism table HTML | `src/app/features/cotizador/components/premium-breakdown-table/premium-breakdown-table.component.html` |
| Organism table SCSS | `src/app/features/cotizador/components/premium-breakdown-table/premium-breakdown-table.component.scss` |
| Molecule alert | `src/app/shared/ui/molecules/incomplete-locations-alert/incomplete-locations-alert.component.ts` |
| Molecule alert HTML | `src/app/shared/ui/molecules/incomplete-locations-alert/incomplete-locations-alert.component.html` |

#### Contratos de I/O de componentes

**CalculationTriggerComponent**
```typescript
@Input()  calculableCount: number;       // N ubicaciones COMPLETE
@Input()  incompleteCount: number;       // M ubicaciones INCOMPLETE
@Input()  calculating: boolean;          // spinner en progreso
@Output() calculate = new EventEmitter<void>();
```

**PremiumSummaryComponent**
```typescript
@Input() result: CalculationResult;
```

**PremiumBreakdownTableComponent**
```typescript
@Input() result: CalculationResult;
// Filtra internamente premiumsByLocation donde calculable === true
// Usa TECHNICAL_COMPONENTS para iterar las 14 filas
```

**IncompleteLocationsAlertComponent**
```typescript
@Input() incompleteLocations: LocationPremium[];  // solo donde calculable === false
// Visible solo cuando incompleteLocations.length > 0
```

#### CalculationPage — responsabilidades

```typescript
// - Inyecta: ActivatedRoute, CalculationService, QuoteStateService, Router
// - Lee folio y version del resolver o de QuoteStateService
// - Estado local: result: CalculationResult | null = null; calculating = false; error: string | null = null
// - onCalculate(): llama CalculationService.calculate(folio, version)
//   - success: asigna result, llama QuoteStateService.refresh()
//   - error 409: muestra mensaje VERSION_CONFLICT
//   - error 422: muestra mensaje NO_CALCULABLE_LOCATIONS
// - onRecalculate(): limpia result (vuelve a Estado A)
// - onContinue(): navega a /quotes/:folio/terms-and-conditions
// - Calcula calculableCount e incompleteCount desde QuoteState o desde result
```

### 2.5 Integración con QuoteStateService

El `QuoteStateService` ya existe en `src/app/core/services/quote-state.service.ts`. Tras un cálculo exitoso la page llama `quoteStateService.refresh()` que emite en `refresh$`. El `AppShellComponent` ya está suscrito a ese stream para refrescar el StatusBar (ver SPEC-006).

La page también lee el `quoteStatus` actual del estado del folio para determinar si el botón "Continuar" está habilitado. Si `quoteStatus === 'CALCULATED'` (ya calculado en sesión previa), la page puede inicializarse directamente en Estado B rescatando los datos de un resolver o llamando al endpoint de estado.

> **Nota:** Si el folio ya tiene `quoteStatus: 'CALCULATED'` al cargar la ruta, la page puede opcionalmente mostrar el resultado previo. Esto queda a decisión de implementación; el criterio mínimo es que el Estado A siempre permita re-ejecutar el cálculo.

---

## 3. LISTA DE TAREAS

### Frontend

#### Modelos y Service (TDD)
- [x] FE-01: Crear `calculation.model.ts` con `CalculationResult`, `LocationPremium`, `CoverageBreakdown`, `BlockingAlert`, `CalculationRequest` y `TECHNICAL_COMPONENTS`
- [x] FE-02: Escribir tests de `CalculationService` (RED): llamada POST correcta, response 200, errores 409 y 422
- [x] FE-03: Implementar `CalculationService.calculate()` hasta pasar los tests (GREEN)
- [x] FE-04: Refactorizar `CalculationService` si aplica (REFACTOR)

#### Componentes UI
- [x] FE-05: Implementar `CalculationTriggerComponent` con `@Input` calculableCount, incompleteCount, calculating y `@Output` calculate
- [x] FE-06: Implementar `PremiumSummaryComponent` con las 3 cards (oscura, primaria, neutral) y formateo MXN
- [x] FE-07: Implementar `PremiumBreakdownTableComponent` con las 14 filas de `TECHNICAL_COMPONENTS`, columnas por ubicación calculable, fila de totales y celda "Total" con fondo distinto; mostrar "—" para valores 0 o null
- [x] FE-08: Implementar `IncompleteLocationsAlertComponent` (Molecule) visible solo cuando `incompleteLocations.length > 0`, listando cada ubicación con sus `blockingAlerts`

#### Page de integración
- [x] FE-09: Implementar `CalculationPage` con:
  - Lectura de `folio` y `version` desde route params / resolver
  - Estado local `result`, `calculating`, `error`
  - `onCalculate()` — POST, manejo de errores 409/422, refresh del StatusBar
  - `onRecalculate()` — limpiar result
  - `onContinue()` — navegar a `/quotes/:folio/terms-and-conditions`
  - Cabecera con eyebrow "Folio FOL-XXXX · Resultado", acciones "Descargar PDF", "Recalcular", "Continuar a términos y condiciones"
- [x] FE-10: Registrar la ruta `calculation` en `cotizador.routes.ts` apuntando a `CalculationPage`
- [x] FE-11: Verificar que el botón "Continuar a términos y condiciones" esté deshabilitado cuando `quoteStatus !== 'CALCULATED'`

#### Validación
- [x] FE-12: Ejecutar `ng build` sin errores ni warnings de compilación
- [x] FE-13: Verificar cobertura de `CalculationService` ≥ 80% con `ng test --code-coverage`

### QA

- [ ] QA-01: Verificar Escenario feliz: cálculo exitoso con 2 ubicaciones COMPLETE → Estado B visible con primas correctas
- [ ] QA-02: Verificar cálculo mixto: 1 COMPLETE + 1 INCOMPLETE → badge de alertas visible y alerta al pie del resultado
- [ ] QA-03: Verificar error 422: botón habilitado, mensaje de error visible, Estado A permanece
- [ ] QA-04: Verificar error 409: mensaje de conflicto de versión visible, Estado A permanece
- [ ] QA-05: Verificar que "—" aparece en celdas con valor 0 o null en la tabla de desglose
- [ ] QA-06: Verificar que `commercialPremium = netPremium × 1.16` coincide con el valor del backend
- [ ] QA-07: Verificar que el StatusBar refleja `CALCULATED` tras cálculo exitoso
- [ ] QA-08: Verificar "Recalcular": vuelve a Estado A con contadores actualizados
- [ ] QA-09: Verificar navegación a `/quotes/:folio/terms-and-conditions` al hacer click en "Continuar"
- [ ] QA-10: Verificar que el botón "Ejecutar cálculo" está deshabilitado si calculableCount === 0
