---
id: SPEC-004
status: IMPLEMENTED
feature: dashboard
created: 2026-04-22
updated: 2026-04-22
author: spec-generator
version: "1.0"
related-specs:
  - SPEC-001  # design-system-atoms — StatusBadge, Sparkline, StatCard, Button, Input, Select
  - SPEC-003  # app-shell — NewFolioModalComponent invocado desde el dashboard
---

# Spec: Dashboard — Panel de Inventario de Folios

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Pantalla principal del cotizador (`/cotizador`). Muestra el inventario de folios activos con métricas resumidas en el header, un componente de filtros y búsqueda, y dos modos de visualización intercambiables (tabla y cuadrícula). El filtrado y el cálculo de métricas se realizan en el cliente a partir de la misma carga inicial de datos.

### Requerimiento de Negocio

El suscriptor o agente debe poder, desde una única pantalla, ver el estado global de todas sus cotizaciones activas, filtrarlas por folio/cliente o estado, y acceder directamente a cualquier folio con un clic. Las métricas del header dan visibilidad rápida del portafolio sin necesidad de navegar.

### Historias de Usuario

#### HU-01: Visualizar inventario de folios

```
Como:        Usuario autenticado (suscriptor / agente)
Quiero:      Ver la lista de folios activos con su información resumida
Para:        Tener visibilidad del estado de mi portafolio de cotizaciones

Prioridad:   Alta
Estimación:  M
Dependencias: SPEC-003 (app-shell, NewFolioModalComponent)
Capa:        Frontend (nuevo endpoint GET /v1/folios requerido al backend)
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Listado de folios cargado correctamente
  Dado que:  el usuario navega a /cotizador
  Cuando:    el servicio GET /v1/folios responde con éxito
  Entonces:  se muestran las tarjetas de métricas (StatCards) con los valores calculados
             Y se muestra la tabla de folios en modo lista (por defecto)
             Y cada fila contiene: folio, cliente, agente, estado, ubicaciones, progreso, prima comercial, fecha
```

**Error Path**
```gherkin
CRITERIO-1.2: Error de carga del inventario
  Dado que:  el usuario navega a /cotizador
  Cuando:    GET /v1/folios responde con error (500 o timeout)
  Entonces:  se muestra un mensaje de error indicando que no se pudieron cargar los folios
             Y las StatCards muestran "—" en lugar de valores
             Y la tabla/grid muestra un estado vacío con opción de reintentar
```

**Edge Case**
```gherkin
CRITERIO-1.3: Inventario vacío (sin folios)
  Dado que:  el usuario no tiene folios creados
  Cuando:    GET /v1/folios responde con lista vacía
  Entonces:  las StatCards muestran 0 en todos los contadores
             Y la tabla/grid muestra un estado vacío con el texto "No hay folios aún"
             Y el botón "Nuevo folio" sigue disponible
```

---

#### HU-02: Filtrar folios por texto y estado

```
Como:        Usuario autenticado
Quiero:      Filtrar el inventario por número de folio, cliente o estado
Para:        Encontrar rápidamente una cotización específica sin recargar la página

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Frontend (lógica cliente, sin petición adicional al backend)
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Filtrado por texto en tiempo real
  Dado que:  la lista de folios está cargada
  Cuando:    el usuario escribe en el campo de búsqueda
  Entonces:  la lista se actualiza instantáneamente mostrando solo folios
             cuyo folioNumber o client contenga el texto (case-insensitive)
             Y las StatCards NO se recalculan (reflejan el total original)
```

```gherkin
CRITERIO-2.2: Filtrado por estado
  Dado que:  la lista de folios está cargada
  Cuando:    el usuario selecciona un estado en el select
  Entonces:  la lista muestra solo folios con ese estado exacto
             Y el filtro de texto sigue activo simultáneamente (filtros acumulativos)
```

```gherkin
CRITERIO-2.3: Restaurar vista completa con "Todos los estados"
  Dado que:  hay un filtro de estado activo
  Cuando:    el usuario selecciona "Todos los estados"
  Entonces:  se muestran todos los folios que coinciden con el filtro de texto vigente
```

**Edge Case**
```gherkin
CRITERIO-2.4: Sin resultados tras filtrado
  Dado que:  hay filtros activos
  Cuando:    ningún folio coincide con los criterios
  Entonces:  la tabla/grid muestra "No se encontraron folios con estos filtros"
             Y los filtros siguen activos y editables
```

---

#### HU-03: Cambiar modo de visualización (lista / cuadrícula)

```
Como:        Usuario autenticado
Quiero:      Alternar entre vista de tabla y cuadrícula
Para:        Visualizar los folios en el formato que mejor se adapte a mi flujo de trabajo

Prioridad:   Media
Estimación:  S
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: Cambio a modo cuadrícula preserva filtros
  Dado que:  el usuario tiene filtros activos en modo lista
  Cuando:    hace clic en el toggle de cuadrícula
  Entonces:  se muestra la cuadrícula de 3 columnas con los mismos folios filtrados
             Y los valores de búsqueda y estado se conservan en los controles
```

```gherkin
CRITERIO-3.2: Regreso a modo lista desde cuadrícula
  Dado que:  el usuario está en modo cuadrícula con filtros activos
  Cuando:    hace clic en el toggle de lista
  Entonces:  se muestra la tabla con los mismos folios filtrados
             Y los filtros no se pierden
```

---

#### HU-04: Navegar a un folio desde el dashboard

```
Como:        Usuario autenticado
Quiero:      Hacer clic en un folio para abrirlo
Para:        Continuar o revisar la cotización de ese folio

Prioridad:   Alta
Estimación:  XS
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: Navegación desde la tabla
  Dado que:  la tabla de folios está visible
  Cuando:    el usuario hace clic en una fila
  Entonces:  el router navega a /quotes/:folioNumber/general-info
```

```gherkin
CRITERIO-4.2: Navegación desde la cuadrícula
  Dado que:  la cuadrícula de folios está visible
  Cuando:    el usuario hace clic en una tarjeta
  Entonces:  el router navega a /quotes/:folioNumber/general-info
```

---

#### HU-05: Crear un nuevo folio desde el dashboard

```
Como:        Usuario autenticado
Quiero:      Hacer clic en "Nuevo folio" para iniciar una cotización
Para:        Crear un nuevo folio sin salir del dashboard

Prioridad:   Alta
Estimación:  XS
Dependencias: SPEC-003 (NewFolioModalComponent)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-05

**Happy Path**
```gherkin
CRITERIO-5.1: Apertura del modal de nuevo folio
  Dado que:  el usuario está en /cotizador
  Cuando:    hace clic en el botón "Nuevo folio"
  Entonces:  se abre NewFolioModalComponent sin navegar fuera del dashboard
```

---

### Reglas de Negocio

1. **Filtros acumulativos en cliente**: el filtro de texto y el filtro de estado se aplican simultáneamente (AND lógico) sin realizar una nueva petición HTTP.
2. **StatCards calculadas del total, no del filtrado**: las métricas del header reflejan SIEMPRE el inventario completo cargado inicialmente, no el subconjunto filtrado.
3. **Cálculo de StatCards**:
   - *Folios totales*: `folios.length` (todos los retornados por GET /v1/folios)
   - *En progreso*: `count(status === 'IN_PROGRESS')`
   - *Calculados + Emitidos*: `count(status === 'CALCULATED') + count(status === 'ISSUED')`
   - *Prima comercial acumulada*: `sum(commercialPremium)` de todos los folios con `commercialPremium != null`
4. **Exportar — visual únicamente**: el botón "Exportar" se renderiza pero no ejecuta ninguna acción en esta fase.
5. **Selección múltiple y menú contextual — visual únicamente**: los checkboxes y el botón de opciones por fila se renderizan pero no tienen lógica activa en esta fase.
6. **Botón "Más filtros" — visual únicamente**: se renderiza pero no abre ningún panel en esta fase.
7. **Modo lista por defecto**: al cargar el dashboard, el modo activo es la tabla (lista).

---

## 2. DISEÑO

### Modelos de Datos

#### Interfaces TypeScript

```typescript
// features/cotizador/models/folio-summary.model.ts

export type QuoteStatus = 'CREATED' | 'IN_PROGRESS' | 'CALCULATED' | 'ISSUED';
export type ViewMode = 'list' | 'grid';

export interface FolioSummary {
  folioNumber: string;          // ej. "FOL-2026-00042"
  client: string;               // nombre del asegurado
  agentCode: string;            // código del agente (ej. "AGT-123")
  agentName: string;            // nombre del agente
  status: QuoteStatus;
  locationCount: number;        // número de ubicaciones
  completionPct: number;        // progreso de la cotización 0-100
  commercialPremium: number | null; // null si aún no se ha calculado
  updatedAt: string;            // ISO 8601 UTC
}

export interface FolioListResponse {
  folios: FolioSummary[];
}

export interface DashboardStats {
  total: number;
  inProgress: number;
  readyToIssue: number;         // CALCULATED + ISSUED
  accumulatedPremium: number;
}

export interface DashboardFilters {
  searchText: string;
  statusFilter: QuoteStatus | 'ALL';
}
```

---

### API Endpoints

> **Nota:** El endpoint `GET /v1/folios` **no existe aún** en el contrato de API (`api-contracts.md`). Esta spec lo define como nuevo y debe ser acordado con el equipo de backend antes de la implementación frontend. El backend debe implementarlo antes o en paralelo.

#### GET /v1/folios

- **Descripción**: Lista el inventario de folios del usuario autenticado con datos de resumen para el dashboard.
- **Auth requerida**: sí
- **Query params** *(opcionales, para paginación futura — no implementar en fase 1)*: ninguno en fase 1
- **Response 200:**
  ```json
  {
    "folios": [
      {
        "folioNumber": "FOL-2026-00042",
        "client": "Empresa Ejemplo SA de CV",
        "agentCode": "AGT-123",
        "agentName": "Juan Pérez",
        "status": "IN_PROGRESS",
        "locationCount": 3,
        "completionPct": 60,
        "commercialPremium": 125000.00,
        "updatedAt": "2026-04-20T15:00:00Z"
      }
    ]
  }
  ```
- **Response 401:** `{ "error": "Unauthorized", "code": "UNAUTHORIZED" }`
- **Response 500:** `{ "error": "Internal server error", "code": "INTERNAL_ERROR" }`

> **Decisión de diseño**: `completionPct` lo calcula el backend (sabe qué pasos están completos). El frontend no recalcula el progreso.
>
> **Nota QA (R-011)**: Los valores de `completionPct` en los datos mock (10, 60, 85, 100, 45) son aproximaciones para desarrollo. El QA funcional debe validar el cálculo real contra el backend, ya que el algoritmo definitivo puede diferir. Los tests contra el mock no detectarán discrepancias de progreso.

---

### Diseño Frontend

#### Estructura de directorios a crear/modificar

```
src/app/
├── features/
│   └── cotizador/
│       ├── models/
│       │   └── folio-summary.model.ts          ← NUEVO
│       ├── services/
│       │   ├── folio.service.ts                ← NUEVO (TDD)
│       │   ├── folio.service.spec.ts           ← NUEVO (test primero)
│       │   ├── dashboard-filter.service.ts     ← NUEVO (TDD)
│       │   └── dashboard-filter.service.spec.ts← NUEVO (test primero)
│       ├── components/
│       │   ├── folio-summary-table/            ← NUEVO (Organism — exclusivo del feature)
│       │   │   ├── folio-summary-table.component.ts
│       │   │   ├── folio-summary-table.component.html
│       │   │   └── folio-summary-table.component.scss
│       │   ├── folio-summary-grid/             ← NUEVO (Organism)
│       │   │   ├── folio-summary-grid.component.ts
│       │   │   ├── folio-summary-grid.component.html
│       │   │   └── folio-summary-grid.component.scss
│       │   └── folio-filters/                  ← NUEVO (Molecule)
│       │       ├── folio-filters.component.ts
│       │       ├── folio-filters.component.html
│       │       └── folio-filters.component.scss
│       └── pages/
│           └── cotizador-dashboard.page.ts     ← MODIFICAR (stub → implementación real)
```

#### Páginas

| Página | Archivo | Ruta | Descripción |
|--------|---------|------|-------------|
| `CotizadorDashboardPage` | `pages/cotizador-dashboard.page.ts` | `/cotizador` | Página principal del inventario de folios |

#### Componentes nuevos

| Componente | Nivel Atomic | Archivo | Inputs | Outputs | Descripción |
|------------|-------------|---------|--------|---------|-------------|
| `FolioSummaryTableComponent` | Organism | `components/folio-summary-table/` | `folios: FolioSummary[]` | `folioClick: EventEmitter<string>` | Tabla con columnas de resumen |
| `FolioSummaryGridComponent` | Organism | `components/folio-summary-grid/` | `folios: FolioSummary[]` | `folioClick: EventEmitter<string>` | Cuadrícula 3 columnas |
| `FolioFiltersComponent` | Molecule | `components/folio-filters/` | `filters: DashboardFilters`, `viewMode: ViewMode` | `filtersChange: EventEmitter<DashboardFilters>`, `viewModeChange: EventEmitter<ViewMode>` | Barra de búsqueda, select de estado y toggle de vista |

> **Nota**: `StatusBadgeComponent`, `SparklineComponent`, `StatCardComponent`, `ButtonComponent`, `InputComponent` y `SelectComponent` se asumen definidos en SPEC-001 (design-system-atoms). Verificar su existencia antes de implementar.

#### Services

| Service | Archivo | Método | Endpoint | Descripción |
|---------|---------|--------|----------|-------------|
| `FolioService` | `services/folio.service.ts` | `listFolios(): Observable<FolioSummary[]>` | `GET /v1/folios` | Obtiene el inventario de folios |
| `DashboardFilterService` | `services/dashboard-filter.service.ts` | `filterFolios(folios, filters): FolioSummary[]` | — | Aplica filtros de texto y estado (lógica pura, sin HTTP) |
| `DashboardFilterService` | `services/dashboard-filter.service.ts` | `computeStats(folios): DashboardStats` | — | Calcula las métricas del header a partir del total de folios |

#### Patrón de la DashboardPage

```typescript
// Pseudocódigo — patrón de composición a seguir
@Component({ ... })
export class CotizadorDashboardPage {
  private readonly folioService = inject(FolioService);
  private readonly filterService = inject(DashboardFilterService);
  private readonly router = inject(Router);

  protected readonly folios$ = this.folioService.listFolios();
  protected filters: DashboardFilters = { searchText: '', statusFilter: 'ALL' };
  protected viewMode: ViewMode = 'list';

  // El filtrado y el cálculo de stats se derivan de folios$ + filters con combineLatest/map
  // Las StatCards usan los totales originales (no el resultado filtrado)
  // El clic en fila/tarjeta llama: this.router.navigate(['/quotes', folioNumber, 'general-info'])
}
```

#### Flujo de datos

```
FolioService.listFolios()
       │
       ▼
 folios$ (Observable<FolioSummary[]>)
       │
       ├──► DashboardFilterService.computeStats(folios)  → StatCards (siempre total)
       │
       └──► DashboardFilterService.filterFolios(folios, filters$) → filteredFolios$
                     │
                     ├──► FolioSummaryTableComponent  (si viewMode === 'list')
                     └──► FolioSummaryGridComponent   (si viewMode === 'grid')
```

#### Ruta

La página ya existe en `cotizador.routes.ts` bajo `/cotizador`. No se requiere agregar una nueva ruta, solo reemplazar el stub del componente por la implementación real.

#### Columnas de la tabla

| Columna | Campo | Formato | Ancho aprox. |
|---------|-------|---------|--------------|
| Folio | `folioNumber` | texto monoespaciado | 170px |
| Cliente | `client` | texto | auto |
| Agente | `agentCode` + `agentName` | nombre en línea 1, código en línea 2 (muted) | 150px |
| Estado | `status` | `StatusBadgeComponent` | 130px |
| Ubic. | `locationCount` | número tabular | 100px |
| Progreso | `completionPct` | `SparklineComponent` + `{n}%` | 160px |
| Prima comercial | `commercialPremium` | moneda MXN (sin decimales si es 0) | 160px |
| Actualizado | `updatedAt` | fecha local (dd/mm/yyyy) | 130px |
| — | — | Botón opciones (menú — visual) | 40px |

#### Tarjeta de cuadrícula

Cada tarjeta contiene:
- Fila superior: `folioNumber` (mono, muted) + `StatusBadge` (derecha)
- Nombre del cliente (bold)
- `agentName` · `locationCount` ubicaciones (muted)
- `SparklineComponent`
- Fila inferior: fecha (muted) + `commercialPremium` (bold)

#### Opciones del select de estado

| Valor | Etiqueta UI |
|-------|-------------|
| `ALL` | Todos los estados |
| `CREATED` | Creado |
| `IN_PROGRESS` | En progreso |
| `CALCULATED` | Calculado |
| `ISSUED` | Emitido |

---

### Arquitectura y Dependencias

- **Dependencias en SPEC-001**: `StatusBadgeComponent`, `SparklineComponent`, `StatCardComponent`, `ButtonComponent`, `InputComponent`, `SelectComponent` — verificar que estén implementados.
- **Dependencia en SPEC-003**: `NewFolioModalComponent` — el botón "Nuevo folio" lo invoca.
- **Nuevo endpoint backend**: `GET /v1/folios` — debe coordinarse con el equipo backend; el frontend puede usar un mock/interceptor hasta que el endpoint esté disponible.
- **Sin paquetes nuevos**: toda la funcionalidad se resuelve con Angular + RxJS.
- **Formato de moneda**: usar `CurrencyPipe` de Angular con locale `es-MX` o un Pipe propio si ya existe en el proyecto.
- **Formato de fecha**: usar `DatePipe` de Angular o un Pipe propio si ya existe.

### Notas de Implementación

- La lógica de filtrado y cálculo de stats en `DashboardFilterService` es **pura** (sin side effects, sin HTTP) para facilitar el TDD con tests unitarios directos.
- El estado del componente (`filters`, `viewMode`) vive en la `CotizadorDashboardPage`; los organisms son **dumb components** que solo reciben `@Input` y emiten `@Output`.
- Suscribirse a `folios$` con `async pipe` en el template para gestión automática del ciclo de vida del Observable.
- Si el backend aún no implementa `GET /v1/folios`, crear un interceptor HTTP de desarrollo o un mock en `environment.ts` con datos semilla (`window.SEED.folios` del prototipo como referencia).

---

## 3. LISTA DE TAREAS

> Checklist accionable. Marcar cada ítem (`[x]`) al completarlo.

### Backend

> **Coordinación requerida**: el backend debe implementar `GET /v1/folios` antes o en paralelo al frontend.

#### Implementación
- [ ] Definir contrato `GET /v1/folios` en `docs/Sofka IQ/uploads/api-contracts.md` (validar con backend team)
- [ ] Implementar endpoint `GET /v1/folios` en `Insurance-Quoter-Back/` (tarea del equipo backend)

---

### Frontend

#### Modelos
- [x] Crear `src/app/features/cotizador/models/folio-summary.model.ts` con interfaces `FolioSummary`, `FolioListResponse`, `DashboardStats`, `DashboardFilters`, `ViewMode`, `QuoteStatus`

#### Services (TDD — test antes que implementación)
- [x] Escribir `folio.service.spec.ts` — tests: `listFolios retorna Observable<FolioSummary[]>`, `listFolios llama GET /v1/folios`, `listFolios propaga error HTTP`
- [x] Implementar `FolioListService.listFolios()` en `folio.service.ts` (con InjectionToken USE_MOCK_FOLIOS)
- [x] Escribir `dashboard-filter.service.spec.ts` — tests: `filterFolios filtra por texto case-insensitive en folioNumber`, `filterFolios filtra por texto en client`, `filterFolios filtra por status exacto`, `filterFolios devuelve todos con statusFilter ALL`, `filterFolios aplica texto y estado acumulados`, `computeStats calcula total`, `computeStats calcula inProgress`, `computeStats calcula readyToIssue (CALCULATED+ISSUED)`, `computeStats suma commercialPremium ignorando null`
- [x] Implementar `DashboardFilterService.filterFolios()` y `computeStats()` en `dashboard-filter.service.ts`

#### Componentes
- [x] Implementar `FolioFiltersComponent` — barra de búsqueda, select de estado, botón "Más filtros" (visual), toggle lista/cuadrícula
- [x] Implementar `FolioSummaryTableComponent` — tabla con todas las columnas especificadas, checkbox visual, botón opciones visual, `@Output folioClick`
- [x] Implementar `FolioSummaryGridComponent` — cuadrícula 3 columnas con tarjetas, `@Output folioClick`
- [x] Reemplazar stub en `cotizador-dashboard.page.ts` con implementación completa: `FolioListService`, `DashboardFilterService`, `StatCards`, `FolioFiltersComponent`, `FolioSummaryTableComponent` / `FolioSummaryGridComponent` (condicional), manejo de estado de carga y error
- [x] Agregar botón "Nuevo folio" que invoque `NewFolioModalComponent`
- [x] Agregar botón "Exportar" visual (sin acción)

#### Integración y Routing
- [x] Verificar que `/cotizador` en `cotizador.routes.ts` apunta a `CotizadorDashboardPage`
- [x] Mock controlado por InjectionToken `USE_MOCK_FOLIOS` (factory: `true` en dev, sobrescribible en prod/tests)

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` sobre criterios CRITERIO-1.1 al 5.1
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos del dashboard
- [ ] Validar cobertura ≥ 80% en `FolioService` y `DashboardFilterService`
- [ ] Verificar navegación correcta a `/quotes/:folioNumber/general-info` desde tabla y cuadrícula
- [ ] Verificar que StatCards no cambian al filtrar
- [ ] Verificar que filtros persisten al cambiar modo de visualización
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
