---
id: SPEC-008
status: IMPLEMENTED
feature: quote-coverages
created: 2026-04-22
updated: 2026-04-23
author: spec-generator
version: "1.0"
related-specs:
  - SPEC-007  # quote-locations (las ubicaciones son la fuente del selector de tabs)
  - SPEC-005  # quote-general-info (folio y version disponibles)
---

# Spec: Opciones de Cobertura por Ubicación (Paso 4/5)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Paso 4 del wizard de cotización. Permite al agente configurar las opciones de cobertura (deducibles y coaseguros) para el folio. La UI presenta un selector de pestañas por ubicación para facilitar la revisión, pero la persistencia sigue el contrato de API: un único array `coverageOptions[]` a nivel de folio. El catálogo contiene 6 coberturas fijas con valores por defecto. El agente puede activar/desactivar coberturas individualmente y ajustar sus porcentajes.

### Requerimiento de Negocio

El cotizador necesita capturar, por cada folio, las coberturas que aplican con sus deducibles y coaseguros antes de ejecutar el cálculo de prima. La configuración es un único conjunto de coberturas compartido para todas las ubicaciones del folio. El patrón de navegación por tab de ubicación es una ayuda visual, no implica persistencia separada por ubicación. Si el folio aún no tiene `coverageOptions`, se inicializa con los valores por defecto del catálogo.

### Historias de Usuario

#### HU-01: Configuración de coberturas del folio

```
Como:        Agente de cotización
Quiero:      Activar o desactivar coberturas y ajustar sus deducibles y coaseguros
Para:        Definir el alcance de la póliza antes del cálculo de prima

Prioridad:   Alta
Estimación:  L
Dependencias: SPEC-007 (ubicaciones deben existir para mostrar el selector de tabs)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Carga de coberturas existentes del folio
  Dado que:  el folio "FOL-2026-00042" tiene coverageOptions ya persistidas en la API
  Cuando:    el agente navega a /quotes/FOL-2026-00042/technical-info
  Entonces:  se hace GET /v1/quotes/FOL-2026-00042/coverage-options
             y se muestran las 6 tarjetas con los valores cargados
             y el contador de coberturas activas refleja las seleccionadas
```

**Happy Path**
```gherkin
CRITERIO-1.2: Inicialización con valores por defecto cuando coverageOptions está vacío
  Dado que:  el folio "FOL-2026-00042" no tiene coverageOptions (array vacío o ausente)
  Cuando:    el agente navega a /quotes/FOL-2026-00042/technical-info
  Entonces:  la UI inicializa el estado local con los 6 ítems del catálogo y sus valores por defecto
             y ninguna cobertura está seleccionada (selected: false)
             y los porcentajes de deducible/coaseguro muestran los valores por defecto del catálogo
```

**Happy Path**
```gherkin
CRITERIO-1.3: Guardar coberturas configuradas
  Dado que:  el agente ha activado "COV-FIRE" y ajustado su deducible a 3%
  Cuando:    hace clic en "Guardar coberturas"
  Entonces:  se envía PUT /v1/quotes/FOL-2026-00042/coverage-options con el array completo y version correcta
             y la respuesta actualiza la version en el estado local
             y se muestra una notificación de éxito
```

**Happy Path**
```gherkin
CRITERIO-1.4: Aplicar configuración a todas las ubicaciones
  Dado que:  el folio tiene 3 ubicaciones y el agente está en la tab de la ubicación 2
             con 4 coberturas activas configuradas
  Cuando:    hace clic en "Aplicar a todas"
  Entonces:  el estado de coberturas de la ubicación 2 (deep clone) se refleja visualmente en todas las tabs
             (la operación es puramente de UI — la persistencia sigue siendo el array flat a nivel folio)
```

**Happy Path**
```gherkin
CRITERIO-1.5: Copiar configuración desde otra ubicación
  Dado que:  hay más de 1 ubicación y el select "Copiar desde:" está visible
  Cuando:    el agente selecciona "UBIC 01" en el select
  Entonces:  el estado de coberturas visible en la pestaña activa se reemplaza por un deep clone del de UBIC 01
             (sin persistir hasta que el agente guarde manualmente)
```

**Error Path**
```gherkin
CRITERIO-1.6: Conflicto de versión optimista
  Dado que:  otro proceso actualizó el folio y la version local es obsoleta
  Cuando:    el agente intenta guardar las coberturas
  Entonces:  la API responde 409 VERSION_CONFLICT
             y la UI muestra el mensaje "Los datos han cambiado en otro proceso. Recarga para continuar."
             y el botón "Guardar coberturas" queda habilitado para reintentar tras recargar
```

**Error Path**
```gherkin
CRITERIO-1.7: Error de red al cargar coberturas
  Dado que:  el backend no está disponible
  Cuando:    el agente navega a /quotes/FOL-2026-00042/technical-info
  Entonces:  se muestra un mensaje de error "No se pudieron cargar las coberturas. Intenta de nuevo."
             y un botón "Reintentar" que ejecuta nuevamente el GET
```

**Edge Case**
```gherkin
CRITERIO-1.8: Desactivar cobertura deshabilita sus campos de edición
  Dado que:  la cobertura "COV-THEFT" estaba activa con deducible 5% y coaseguro 100%
  Cuando:    el agente apaga el switch de "COV-THEFT"
  Entonces:  el body de la card queda con opacity 0.5 y pointer-events: none
             y el badge "Activa" desaparece del header
             y el header pierde el fondo tintado
             y los valores de deducible/coaseguro se conservan (no se borran)
```

**Edge Case**
```gherkin
CRITERIO-1.9: Solo 1 ubicación — botón "Aplicar a todas" deshabilitado
  Dado que:  el folio tiene exactamente 1 ubicación
  Cuando:    el agente visualiza la pantalla de coberturas
  Entonces:  el botón "Aplicar a todas" está presente pero deshabilitado (disabled)
             y el select "Copiar desde:" no es visible
```

### Reglas de Negocio

1. La API almacena un único array `coverageOptions[]` por folio; el selector de tabs por ubicación es navegación de UI, no datos separados.
2. Al inicializar: si `coverageOptions` está vacío, poblar con los 6 ítems del catálogo con `selected: false` y porcentajes por defecto.
3. "Aplicar a todas" replica el estado visible de la tab activa como deep clone; no persiste automáticamente.
4. "Copiar desde" reemplaza el estado visible de la tab activa; no persiste automáticamente.
5. El deducible tiene step de 0.5%; el coaseguro tiene step de 5%.
6. El body de la card queda deshabilitado (opacity 0.5, pointer-events: none) cuando `selected: false`; los valores se conservan.
7. El botón "Aplicar a todas" está deshabilitado si `numberOfLocations <= 1`.
8. El select "Copiar desde" no se renderiza si `numberOfLocations <= 1`.
9. Toda operación de escritura envía la `version` actual para control optimista.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas

| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `CoverageOption` | modelo TypeScript | nueva | Representa una opción de cobertura con su configuración |
| `CoverageOptionsResponse` | DTO TypeScript | nueva | Respuesta GET y PUT del endpoint de coberturas |
| `CoverageOptionsRequest` | DTO TypeScript | nueva | Body del PUT de coberturas |

#### Campos del modelo `CoverageOption`

| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `code` | `string` | sí | uno de los 6 códigos del catálogo | Identificador de la cobertura |
| `description` | `string` | sí | — | Nombre de la cobertura en español |
| `selected` | `boolean` | sí | — | Si la cobertura está activa |
| `deductiblePercentage` | `number` | sí | > 0, step 0.5 | Porcentaje de deducible |
| `coinsurancePercentage` | `number` | sí | > 0, step 5 | Porcentaje de coaseguro |

#### Catálogo de coberturas (valores por defecto)

| Código | Descripción | Deducible % | Coaseguro % |
|--------|-------------|-------------|-------------|
| `COV-FIRE` | Incendio y riesgos adicionales | 2.0 | 80.0 |
| `COV-CAT` | Cobertura catastrófica CATTEV/CATFHM | 3.0 | 90.0 |
| `COV-THEFT` | Robo con violencia | 5.0 | 100.0 |
| `COV-BI` | Pérdida de rentas / BI | 3.0 | 80.0 |
| `COV-ELEC` | Equipo electrónico | 10.0 | 100.0 |
| `COV-GLASS` | Vidrios | 5.0 | 100.0 |

#### Interfaces TypeScript

```typescript
// features/cotizador/models/coverage.model.ts

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
  { code: 'COV-FIRE',  description: 'Incendio y riesgos adicionales',       selected: false, deductiblePercentage: 2.0,  coinsurancePercentage: 80.0  },
  { code: 'COV-CAT',   description: 'Cobertura catastrófica CATTEV/CATFHM', selected: false, deductiblePercentage: 3.0,  coinsurancePercentage: 90.0  },
  { code: 'COV-THEFT', description: 'Robo con violencia',                   selected: false, deductiblePercentage: 5.0,  coinsurancePercentage: 100.0 },
  { code: 'COV-BI',    description: 'Pérdida de rentas / BI',               selected: false, deductiblePercentage: 3.0,  coinsurancePercentage: 80.0  },
  { code: 'COV-ELEC',  description: 'Equipo electrónico',                   selected: false, deductiblePercentage: 10.0, coinsurancePercentage: 100.0 },
  { code: 'COV-GLASS', description: 'Vidrios',                              selected: false, deductiblePercentage: 5.0,  coinsurancePercentage: 100.0 },
];
```

### API Endpoints

#### GET /v1/quotes/{folio}/coverage-options

- **Descripción**: Obtiene las opciones de cobertura configuradas para el folio
- **Path param**: `folio` — número de folio (ej. `FOL-2026-00042`)
- **Response 200**:
  ```json
  {
    "folioNumber": "FOL-2026-00042",
    "coverageOptions": [
      {
        "code": "COV-FIRE",
        "description": "Incendio y riesgos adicionales",
        "selected": true,
        "deductiblePercentage": 2.0,
        "coinsurancePercentage": 80.0
      }
    ],
    "version": 6
  }
  ```
- **Response 404**: `{ "error": "Folio not found", "code": "FOLIO_NOT_FOUND" }`

#### PUT /v1/quotes/{folio}/coverage-options

- **Descripción**: Reemplaza las opciones de cobertura del folio completas
- **Request Body**:
  ```json
  {
    "coverageOptions": [
      {
        "code": "COV-FIRE",
        "selected": true,
        "deductiblePercentage": 2.0,
        "coinsurancePercentage": 80.0
      }
    ],
    "version": 6
  }
  ```
- **Response 200**:
  ```json
  {
    "folioNumber": "FOL-2026-00042",
    "coverageOptions": [ ... ],
    "updatedAt": "2026-04-22T15:45:00Z",
    "version": 7
  }
  ```
- **Response 404**: `{ "error": "Folio not found", "code": "FOLIO_NOT_FOUND" }`
- **Response 409**: `{ "error": "Optimistic lock conflict", "code": "VERSION_CONFLICT" }`
- **Response 422**: `{ "error": "Validation failed", "code": "VALIDATION_ERROR", "fields": [...] }`

### Diseño Frontend

#### Ruta

La pantalla se monta bajo la ruta ya existente `/quotes/:folioNumber/technical-info`, gestionada por `TechnicalInfoPage` (stub actual). La ruta **no cambia**; solo se implementa el contenido de la página.

#### Componentes nuevos

Todos los componentes son **standalone**. La página `TechnicalInfoPage` existente se reemplaza con la implementación completa.

| Componente | Nivel Atomic | Archivo | Responsabilidad |
|------------|-------------|---------|----------------|
| `TechnicalInfoPage` (reemplaza stub) | Page | `pages/technical-info.page.ts` | Layout de la pantalla, orquesta carga y guardado |
| `LocationTabSelectorComponent` | Molecule | `components/coverages/location-tab-selector/location-tab-selector.component.ts` | Tira de tabs scrollable por ubicación + botón "Aplicar a todas" |
| `CoverageContextBarComponent` | Molecule | `components/coverages/coverage-context-bar/coverage-context-bar.component.ts` | Barra con nombre de ubicación activa, contador y select "Copiar desde" |
| `CoverageOptionsGridComponent` | Organism | `components/coverages/coverage-options-grid/coverage-options-grid.component.ts` | Grid 2 columnas que renderiza las 6 `CoverageCardComponent` |
| `CoverageCardComponent` | Molecule | `components/coverages/coverage-card/coverage-card.component.ts` | Tarjeta de una cobertura: switch, nombre, badge, campos numéricos |

#### Inputs / Outputs por componente

**`LocationTabSelectorComponent`**

| Binding | Tipo | Descripción |
|---------|------|-------------|
| `@Input() locations` | `LocationSummaryItem[]` | Lista de ubicaciones del folio |
| `@Input() activeIndex` | `number` | Índice (1-based) de la tab activa |
| `@Input() coverageOptions` | `CoverageOption[]` | Array flat de coberturas (para calcular N/M activas) |
| `@Output() tabSelected` | `EventEmitter<number>` | Índice de la tab seleccionada |
| `@Output() applyToAll` | `EventEmitter<void>` | Click en "Aplicar a todas" |

**`CoverageContextBarComponent`**

| Binding | Tipo | Descripción |
|---------|------|-------------|
| `@Input() locationName` | `string` | Nombre de la ubicación activa |
| `@Input() activeCount` | `number` | Coberturas activas |
| `@Input() totalCount` | `number` | Total de coberturas |
| `@Input() otherLocations` | `LocationSummaryItem[]` | Demás ubicaciones para el select "Copiar desde" |
| `@Output() copyFrom` | `EventEmitter<number>` | Índice de la ubicación de origen seleccionada |

**`CoverageOptionsGridComponent`**

| Binding | Tipo | Descripción |
|---------|------|-------------|
| `@Input() coverageOptions` | `CoverageOption[]` | Las 6 coberturas con su estado |
| `@Output() coverageChanged` | `EventEmitter<CoverageOption>` | Emite la cobertura modificada (switch o campo) |

**`CoverageCardComponent`**

| Binding | Tipo | Descripción |
|---------|------|-------------|
| `@Input() coverage` | `CoverageOption` | Datos de la cobertura |
| `@Output() changed` | `EventEmitter<CoverageOption>` | Emite el objeto completo actualizado al cambiar cualquier campo |

#### Lógica de estado en `TechnicalInfoPage`

```
Estado local de la página:
  - coverageOptions: CoverageOption[]     ← array flat compartido (desde la API)
  - version: number                       ← para optimistic lock
  - locations: LocationSummaryItem[]      ← para el selector de tabs (desde LocationService)
  - activeLocationIndex: number           ← tab actualmente visible (1-based)
  - saving: boolean
  - loading: boolean
  - error: string | null

Operaciones:
  - ngOnInit → llamar a CoverageService.obtener(folio) + LocationService.getSummary(folio)
    → si coverageOptions vacío: inicializar con DEFAULT_COVERAGE_OPTIONS
  - onTabSelected(index) → activeLocationIndex = index (sin petición HTTP)
  - onApplyToAll() → copiar coverageOptions actual a todos los "contextos visuales" de tabs (UI only)
  - onCopyFrom(sourceIndex) → reemplazar coverageOptions visible por deep clone del estado del tab origen
  - onCoverageChanged(updated) → reemplazar el ítem en coverageOptions por referencia de code
  - onSave() → CoverageService.guardar(folio, coverageOptions, version) → actualizar version
```

> **Nota de implementación**: dado que `coverageOptions` es flat (no por ubicación), el estado de todas las tabs es el mismo array. "Aplicar a todas" y "Copiar desde" en la práctica no hacen nada diferente a editar el array compartido, ya que todas las tabs muestran y modifican el mismo conjunto. La UX de tabs es decorativa en este modelo de API. La implementación debe respetar esto sin simular persistencia separada por tab.

#### Services

| Servicio | Archivo | Método | Endpoint |
|----------|---------|--------|---------|
| `CoverageService` | `features/cotizador/services/coverage.service.ts` | `obtener(folio: string): Observable<CoverageOptionsResponse>` | `GET /v1/quotes/{folio}/coverage-options` |
| `CoverageService` | mismo archivo | `guardar(folio: string, options: CoverageOptionRequest[], version: number): Observable<CoverageOptionsResponse>` | `PUT /v1/quotes/{folio}/coverage-options` |
| `LocationService` (existente) | `features/cotizador/services/location.service.ts` | `getSummary(folio)` | ya implementado — reutilizar |

#### Modelo de archivo

```
src/app/features/cotizador/
├── models/
│   └── coverage.model.ts                               ← nuevo
├── services/
│   ├── coverage.service.ts                             ← nuevo
│   └── coverage.service.spec.ts                        ← nuevo (TDD primero)
├── components/
│   └── coverages/
│       ├── location-tab-selector/
│       │   ├── location-tab-selector.component.ts      ← nuevo
│       │   ├── location-tab-selector.component.html    ← nuevo
│       │   └── location-tab-selector.component.scss    ← nuevo
│       ├── coverage-context-bar/
│       │   ├── coverage-context-bar.component.ts       ← nuevo
│       │   ├── coverage-context-bar.component.html     ← nuevo
│       │   └── coverage-context-bar.component.scss     ← nuevo
│       ├── coverage-options-grid/
│       │   ├── coverage-options-grid.component.ts      ← nuevo
│       │   ├── coverage-options-grid.component.html    ← nuevo
│       │   └── coverage-options-grid.component.scss    ← nuevo
│       └── coverage-card/
│           ├── coverage-card.component.ts              ← nuevo
│           ├── coverage-card.component.html            ← nuevo
│           └── coverage-card.component.scss            ← nuevo
└── pages/
    └── technical-info.page.ts                          ← reemplazar stub
```

#### Átomos del design system disponibles (reutilizar)

| Átomo | Selector | Uso en este feature |
|-------|---------|---------------------|
| `SwitchComponent` | `app-shared-switch` | Toggle de activación de cobertura en `CoverageCardComponent` |
| `BadgeComponent` | `app-shared-badge` | Badge "Activa" en header de `CoverageCardComponent` |
| `InputComponent` | `app-shared-input` | Campos de deducible y coaseguro en `CoverageCardComponent` |
| `SelectComponent` | `app-shared-select` | Select "Copiar desde:" en `CoverageContextBarComponent` |
| `BtnComponent` | `app-shared-btn` | Botón "Aplicar a todas" y "Guardar coberturas" |
| `SectionHeaderComponent` | `app-shared-section-header` | Cabecera de la página |

### Arquitectura y Dependencias

- Sin paquetes nuevos — reutiliza `HttpClient`, `ReactiveFormsModule`, RxJS existentes.
- `CoverageService` se inyecta con `inject()` en `TechnicalInfoPage` (patrón del proyecto).
- `LocationService.getSummary()` ya existe; importar desde `features/cotizador/services/location.service.ts`.
- La ruta `/quotes/:folioNumber/technical-info` ya está registrada en `cotizador.routes.ts`; **no modificar rutas**.

### Notas de Implementación

1. **Modelo flat vs. UX por tabs**: aunque la UI sugiere coberturas independientes por ubicación, la API guarda un único array. No inventar persistencia por índice de ubicación; todas las tabs leen y escriben el mismo array.
2. **Inicialización vacía**: el GET puede devolver `coverageOptions: []` si el folio es nuevo. En ese caso, inicializar con `DEFAULT_COVERAGE_OPTIONS` en memoria (no persistir automáticamente; el agente debe guardar manualmente).
3. **Deep clone**: "Aplicar a todas" y "Copiar desde" deben usar `structuredClone()` o `JSON.parse(JSON.stringify(...))` para evitar referencias compartidas en el estado local.
4. **ReactiveFormsModule**: usar `FormArray` de `FormGroup` para los campos de cada cobertura, o manejar el estado directamente con `CoverageOption[]` y `EventEmitter` en los componentes hijos. Preferir el segundo para reducir complejidad de formulario anidado.
5. **Atomic Design**: `CoverageCardComponent` es Molecule (contiene átomos `Switch`, `Badge`, `Input`); `CoverageOptionsGridComponent` es Organism (contiene múltiples Molecules); la página es un Page.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Frontend

#### Modelo

- [ ] Crear `src/app/features/cotizador/models/coverage.model.ts`
  - Interfaces: `CoverageCode`, `CoverageOption`, `CoverageOptionsResponse`, `CoverageOptionRequest`, `CoverageOptionsRequest`
  - Constante: `DEFAULT_COVERAGE_OPTIONS`

#### Service (TDD — test primero)

- [ ] Crear `coverage.service.spec.ts` con los casos de test (RED)
  - `obtener retorna Observable<CoverageOptionsResponse> al recibir 200`
  - `obtener propaga error al recibir 404`
  - `guardar envía PUT con body y version correctos`
  - `guardar propaga error 409 VERSION_CONFLICT`
  - `guardar propaga error 422 VALIDATION_ERROR`
- [ ] Crear `coverage.service.ts` que pase los tests (GREEN)
  - `obtener(folio: string): Observable<CoverageOptionsResponse>`
  - `guardar(folio: string, options: CoverageOptionRequest[], version: number): Observable<CoverageOptionsResponse>`

#### Componentes

- [ ] Implementar `CoverageCardComponent` (Molecule)
  - Switch toggle + nombre + código + Badge "Activa" (header)
  - Fondo tintado en header cuando `selected: true` (color primario al 7%)
  - Campos numéricos Deducible (step 0.5) y Coaseguro (step 5)
  - Body con opacity 0.5 y pointer-events: none cuando `selected: false`
  - Emite `changed` en cada modificación

- [ ] Implementar `CoverageOptionsGridComponent` (Organism)
  - Grid 2 columnas de `CoverageCardComponent`
  - Propaga `coverageChanged` hacia arriba

- [ ] Implementar `LocationTabSelectorComponent` (Molecule)
  - Tira horizontal scrollable de tabs
  - Cada tab: etiqueta "UBIC 0N", nombre de ubicación, contador "N/M coberturas activas"
  - Tab activa con fondo y borde de color primario
  - Botón "Aplicar a todas" deshabilitado si `locations.length <= 1`
  - Emite `tabSelected` y `applyToAll`

- [ ] Implementar `CoverageContextBarComponent` (Molecule)
  - Nombre de ubicación activa + contador "X de Y coberturas activas"
  - Select "Copiar desde:" solo visible si `otherLocations.length > 0`
  - Emite `copyFrom` con el índice de ubicación origen

- [ ] Reemplazar stub de `TechnicalInfoPage` con implementación completa
  - Carga en `ngOnInit`: `CoverageService.obtener()` + `LocationService.getSummary()`
  - Inicialización con `DEFAULT_COVERAGE_OPTIONS` si el array viene vacío
  - Manejo de `onTabSelected`, `onApplyToAll`, `onCopyFrom`, `onCoverageChanged`
  - Botón "Guardar coberturas" llama a `CoverageService.guardar()`
  - Manejo de error 409 con mensaje al usuario
  - Estados de `loading` y `saving`

#### Tests del Service (cobertura ≥ 80%)

- [ ] `obtener retorna CoverageOptionsResponse en respuesta 200`
- [ ] `obtener lanza error con código FOLIO_NOT_FOUND en respuesta 404`
- [ ] `guardar construye el body PUT con coverageOptions y version`
- [ ] `guardar retorna la respuesta actualizada con nueva version`
- [ ] `guardar propaga HttpErrorResponse 409 al suscriptor`
- [ ] `guardar propaga HttpErrorResponse 422 al suscriptor`

### QA

- [ ] Ejecutar `/gherkin-case-generator` → escenarios para CRITERIO-1.1 a CRITERIO-1.9
- [ ] Ejecutar `/risk-identifier` → clasificación ASD de riesgos del feature
- [ ] Validar cobertura de tests del servicio ≥ 80% (`ng test --code-coverage`)
- [ ] Verificar que el stub `TechnicalInfoPage` fue completamente reemplazado
- [ ] Confirmar que las rutas existentes no fueron modificadas
- [ ] Verificar comportamiento del botón "Aplicar a todas" con 1 ubicación (deshabilitado)
- [ ] Verificar que el select "Copiar desde" no aparece con 1 ubicación
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
