---
id: SPEC-003
status: IMPLEMENTED
feature: app-shell
created: 2026-04-22
updated: 2026-04-22
author: spec-generator
version: "1.0"
related-specs:
  - SPEC-001  # design-system-atoms — átomos que componen los organisms del shell
  - SPEC-002  # frontend-docker-setup — prerequisito de infraestructura
---

# Spec: App Shell — Layout Estructural del Cotizador

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Implementar el esqueleto visual de la aplicación: los componentes de nivel Template y Organism que están presentes en todas las pantallas del cotizador. Incluye el header global, el stepper de progreso, la barra de estado inferior y el modal de creación de folio, orquestados por un MainLayout que controla la visibilidad condicional según la ruta activa.

### Requerimiento de Negocio

El usuario suscriptor/agente debe ver en todo momento en qué paso del proceso de cotización se encuentra, cuál es el estado de completitud de cada sección y los datos identificatorios del folio activo, sin necesidad de navegar a una pantalla específica para obtener esa información.

### Historias de Usuario

#### HU-01: Header global de la aplicación

```
Como:        Usuario del cotizador (suscriptor o agente)
Quiero:      Ver el header con logo, breadcrumb del folio activo, buscador y mi perfil en todo momento
Para:        Orientarme dentro de la aplicación y acceder rápidamente al contexto de trabajo

Prioridad:   Alta
Estimación:  S
Dependencias: SPEC-001 (átomos reutilizados)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Header visible en ruta de dashboard
  Dado que:  El usuario navega a /cotizador
  Cuando:    La página carga
  Entonces:  Se muestra el logo "IQ" y la marca "Sofka IQ / Cotizador de Daños"
             Y el breadcrumb muestra solo "Cotizaciones" (sin folio)
             Y el buscador con placeholder "Buscar…" y atajo ⌘K son visibles
             Y se muestra el avatar con nombre y rol del usuario

CRITERIO-1.2: Breadcrumb muestra folio activo
  Dado que:  El usuario navega a /quotes/FOL-2026-00042/general-info
  Cuando:    La página carga
  Entonces:  El breadcrumb muestra "Cotizaciones → FOL-2026-00042"
```

#### HU-02: Stepper de progreso del folio

```
Como:        Usuario del cotizador
Quiero:      Ver el estado de cada sección de la cotización en una barra de pasos
Para:        Identificar qué secciones están completas, incompletas o pendientes y navegar directamente a ellas

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01, QuoteStateService
Capa:        Frontend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Stepper refleja estado real del folio
  Dado que:  El usuario navega a /quotes/FOL-2026-00042/general-info
  Cuando:    QuoteStateService retorna { generalInfo: "COMPLETE", layout: "COMPLETE", locations: "INCOMPLETE", coverageOptions: "PENDING", calculation: "PENDING" }
  Entonces:  El paso "Datos generales" muestra ícono check
             Y el paso "Layout" muestra ícono check
             Y el paso "Ubicaciones" muestra ícono de alerta
             Y los pasos "Coberturas" y "Cálculo" muestran número de paso

CRITERIO-2.2: Clic en paso navega a la ruta correspondiente
  Dado que:  El Stepper está visible y el paso "Ubicaciones" es clickeable
  Cuando:    El usuario hace clic en el paso "Ubicaciones"
  Entonces:  El router navega a /quotes/FOL-2026-00042/locations
```

**Edge Case**
```gherkin
CRITERIO-2.3: Stepper NO visible en ruta de dashboard
  Dado que:  El usuario navega a /cotizador
  Cuando:    La página carga
  Entonces:  El StepperComponent NO se renderiza en el DOM
```

#### HU-03: Barra de estado del folio activo

```
Como:        Usuario del cotizador
Quiero:      Ver el número de folio, su estado, porcentaje de completitud y ubicaciones completas en la parte inferior de la pantalla
Para:        Monitorear el progreso de la cotización sin salir de la sección actual

Prioridad:   Alta
Estimación:  S
Dependencias: HU-02, QuoteStateService
Capa:        Frontend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: StatusBar muestra progreso real del folio
  Dado que:  El usuario está en /quotes/FOL-2026-00042/locations
  Cuando:    QuoteStateService retorna { completionPercentage: 75, quoteStatus: "IN_PROGRESS" }
  Entonces:  La StatusBar muestra "FOL-2026-00042"
             Y el StatusBadge refleja el estado "IN_PROGRESS"
             Y la barra Sparkline representa el 75%
             Y se muestra "75% completado"
```

**Edge Case**
```gherkin
CRITERIO-3.2: StatusBar NO visible en ruta de dashboard
  Dado que:  El usuario navega a /cotizador
  Cuando:    La página carga
  Entonces:  El StatusBarComponent NO se renderiza en el DOM
```

#### HU-04: Modal de creación de folio

```
Como:        Suscriptor o agente
Quiero:      Crear un nuevo folio seleccionando suscriptor y agente desde un modal
Para:        Iniciar el proceso de cotización con los datos mínimos requeridos

Prioridad:   Alta
Estimación:  M
Dependencias: FolioService, CatalogService
Capa:        Frontend
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: Creación exitosa navega al paso Datos generales
  Dado que:  El modal está abierto con suscriptor "SUB-001" y agente "AGT-123" seleccionados
  Cuando:    El usuario hace clic en "Crear folio"
  Entonces:  FolioService llama a POST /v1/folios con { subscriberId: "SUB-001", agentCode: "AGT-123" }
             Y el modal se cierra
             Y el router navega a /quotes/FOL-2026-00042/general-info

CRITERIO-4.2: Lista de agentes se filtra por suscriptor seleccionado
  Dado que:  El modal está abierto y el usuario selecciona el suscriptor "SUB-001"
  Cuando:    Se actualiza el Select de suscriptor
  Entonces:  El Select de agente muestra solo los agentes cuyo subscriberId es "SUB-001"
```

**Error Path**
```gherkin
CRITERIO-4.3: Error del backend muestra mensaje al usuario
  Dado que:  El modal está abierto con datos válidos
  Cuando:    POST /v1/folios retorna HTTP 400 (INVALID_REFERENCE)
  Entonces:  El modal permanece abierto
             Y se muestra el mensaje de error al usuario
             Y el botón "Crear folio" se reactiva
```

**Edge Case**
```gherkin
CRITERIO-4.4: Respuesta 200 idempotente también navega al folio
  Dado que:  Ya existe un folio CREATED para los mismos parámetros
  Cuando:    POST /v1/folios retorna HTTP 200 con folioNumber: "FOL-2026-00042"
  Entonces:  El comportamiento es idéntico al caso 201 — navega a /quotes/FOL-2026-00042/general-info
```

#### HU-05: MainLayout orquesta visibilidad condicional

```
Como:        Usuario del cotizador
Quiero:      Que el Stepper y la StatusBar solo aparezcan en las rutas de folio
Para:        Que el dashboard de selección/creación no tenga elementos que no aplican en ese contexto

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01, HU-02, HU-03
Capa:        Frontend
```

#### Criterios de Aceptación — HU-05

```gherkin
CRITERIO-5.1: MainLayout controla visibilidad según ruta
  Dado que:  El router navega entre /cotizador y /quotes/:folio/general-info
  Cuando:    La URL contiene /quotes/:folio/
  Entonces:  StepperComponent y StatusBarComponent se renderizan
  Cuando:    La URL es /cotizador
  Entonces:  StepperComponent y StatusBarComponent NO se renderizan
```

### Reglas de Negocio

1. El `StepperComponent` y el `StatusBarComponent` solo se muestran cuando el parámetro de ruta `:folio` está presente.
2. El paso activo en el Stepper se determina por la URL actual (no por el estado del folio).
3. Un paso en estado `INCOMPLETE` muestra ícono de alerta; en `COMPLETE` muestra check; en `PENDING` o `IN_PROGRESS` muestra número.
4. El agente del modal se filtra **en cliente** sobre la lista completa de agentes recibida del catálogo, usando `subscriberId` como criterio.
5. Los endpoints `/v1/subscribers` y `/v1/agents` provienen del **servicio Core** (puerto 8081, `AppConfigService.coreUrl`). Los endpoints de folios y estado vienen del **backend** (puerto 8080, `AppConfigService.apiUrl`).
6. El botón "Crear folio" del modal se deshabilita mientras la petición está en curso (evitar doble submit).

---

## 2. DISEÑO

### Modelos de Datos

#### Interfaces TypeScript del dominio

```typescript
// src/app/core/models/folio.model.ts
export type QuoteStatus = 'CREATED' | 'IN_PROGRESS' | 'CALCULATED' | 'ISSUED';
export type SectionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'INCOMPLETE';
export type StepStatus = 'PENDING' | 'INCOMPLETE' | 'COMPLETE';

export interface FolioResponse {
  folioNumber: string;
  quoteStatus: QuoteStatus;
  underwritingData: {
    subscriberId: string;
    agentCode: string;
  };
  createdAt: string;
  version: number;
}

export interface QuoteState {
  folioNumber: string;
  quoteStatus: QuoteStatus;
  completionPercentage: number;
  sections: {
    generalInfo: SectionStatus;
    layout: SectionStatus;
    locations: SectionStatus;
    coverageOptions: SectionStatus;
    calculation: SectionStatus;
  };
  version: number;
  updatedAt: string;
}

export interface StepDefinition {
  key: keyof QuoteState['sections'];
  label: string;
  route: string;
}

// src/app/core/models/catalog.model.ts
export interface Subscriber {
  id: string;
  name: string;
}

export interface Agent {
  code: string;
  name: string;
  subscriberId: string;
}
```

#### Constante de pasos del Stepper

```typescript
// src/app/shared/ui/organisms/stepper/stepper.steps.ts
export const QUOTE_STEPS: StepDefinition[] = [
  { key: 'generalInfo',    label: 'Datos generales', route: 'general-info' },
  { key: 'layout',         label: 'Layout',          route: 'layout' },
  { key: 'locations',      label: 'Ubicaciones',     route: 'locations' },
  { key: 'coverageOptions',label: 'Coberturas',      route: 'technical-info' },
  { key: 'calculation',    label: 'Cálculo',         route: 'terms-and-conditions' },
];
```

### API Endpoints

#### POST /v1/folios — Crear / recuperar folio (FolioService)

- **Base URL:** `AppConfigService.apiUrl` (backend, puerto 8080)
- **Request Body:**
  ```json
  { "subscriberId": "SUB-001", "agentCode": "AGT-123" }
  ```
- **Response 201 / 200:** `FolioResponse` (misma estructura)
- **Response 400:** `{ "error": "Invalid subscriber or agent", "code": "INVALID_REFERENCE" }`
- **Response 422:** `{ "error": "Validation failed", "code": "VALIDATION_ERROR", "fields": [...] }`

#### GET /v1/quotes/{folio}/state — Estado del folio (QuoteStateService)

- **Base URL:** `AppConfigService.apiUrl` (backend, puerto 8080)
- **Response 200:** `QuoteState`
- **Response 404:** `{ "error": "Folio not found", "code": "FOLIO_NOT_FOUND" }`

#### GET /v1/subscribers — Catálogo de suscriptores (CatalogService)

- **Base URL:** `AppConfigService.coreUrl` (core, puerto 8081)
- **Response 200:** `{ "subscribers": Subscriber[] }`

#### GET /v1/agents — Catálogo de agentes (CatalogService)

- **Base URL:** `AppConfigService.coreUrl` (core, puerto 8081)
- **Response 200:** `{ "agents": Agent[] }`
- Filtrado por `subscriberId` se realiza **en cliente** sobre la lista completa.

### Diseño Frontend

#### Árbol de archivos nuevos

```
src/app/
├── core/
│   ├── models/
│   │   ├── folio.model.ts                              ← NUEVO
│   │   └── catalog.model.ts                            ← NUEVO
│   └── services/
│       ├── folio.service.ts                            ← NUEVO (TDD)
│       ├── folio.service.spec.ts                       ← NUEVO
│       ├── quote-state.service.ts                      ← NUEVO (TDD)
│       ├── quote-state.service.spec.ts                 ← NUEVO
│       ├── catalog.service.ts                          ← NUEVO (TDD)
│       └── catalog.service.spec.ts                     ← NUEVO
└── shared/
    └── ui/
        ├── organisms/
        │   ├── app-header/
        │   │   ├── app-header.component.ts             ← NUEVO
        │   │   ├── app-header.component.html           ← NUEVO
        │   │   └── app-header.component.scss           ← NUEVO
        │   ├── stepper/
        │   │   ├── stepper.component.ts                ← NUEVO
        │   │   ├── stepper.component.html              ← NUEVO
        │   │   ├── stepper.component.scss              ← NUEVO
        │   │   └── stepper.steps.ts                    ← NUEVO
        │   └── status-bar/
        │       ├── status-bar.component.ts             ← NUEVO
        │       ├── status-bar.component.html           ← NUEVO
        │       └── status-bar.component.scss           ← NUEVO
        └── templates/
            └── main-layout/
                ├── main-layout.component.ts            ← NUEVO
                ├── main-layout.component.html          ← NUEVO
                └── main-layout.component.scss          ← NUEVO

src/app/features/
└── cotizador/
    ├── components/
    │   └── new-folio-modal/
    │       ├── new-folio-modal.component.ts            ← NUEVO
    │       ├── new-folio-modal.component.html          ← NUEVO
    │       └── new-folio-modal.component.scss          ← NUEVO
    └── cotizador.routes.ts                             ← NUEVO (registrar rutas)
```

#### Componentes nuevos

| Componente | Nivel | Carpeta | Inputs | Outputs |
|------------|-------|---------|--------|---------|
| `AppHeaderComponent` | Organism | `shared/ui/organisms/app-header/` | `@Input() folioNumber?: string`, `@Input() userName: string`, `@Input() userRole: string` | — |
| `StepperComponent` | Organism | `shared/ui/organisms/stepper/` | `@Input() folio: string`, `@Input() sections: QuoteState['sections']`, `@Input() activeRoute: string` | `@Output() stepClick: EventEmitter<string>` |
| `StatusBarComponent` | Organism | `shared/ui/organisms/status-bar/` | `@Input() state: QuoteState` | — |
| `NewFolioModalComponent` | Organism | `features/cotizador/components/new-folio-modal/` | `@Input() isOpen: boolean` | `@Output() closed: EventEmitter<void>`, `@Output() folioCreated: EventEmitter<string>` |
| `MainLayoutComponent` | Template | `shared/ui/templates/main-layout/` | — | — |

#### Services (TDD obligatorio)

| Service | Archivo | Método | Endpoint |
|---------|---------|--------|----------|
| `FolioService` | `core/services/folio.service.ts` | `crearFolio(subscriberId, agentCode): Observable<FolioResponse>` | `POST /v1/folios` |
| `QuoteStateService` | `core/services/quote-state.service.ts` | `obtenerEstado(folio): Observable<QuoteState>` | `GET /v1/quotes/{folio}/state` |
| `CatalogService` | `core/services/catalog.service.ts` | `obtenerSuscriptores(): Observable<Subscriber[]>` | `GET /v1/subscribers` |
| `CatalogService` | `core/services/catalog.service.ts` | `obtenerAgentes(): Observable<Agent[]>` | `GET /v1/agents` |

#### Lógica de visibilidad en MainLayoutComponent

```typescript
// main-layout.component.ts
export class MainLayoutComponent {
  private readonly router = inject(Router);
  readonly isFolioRoute = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url.includes('/quotes/'))
    ),
    { initialValue: false }
  );
}
```

```html
<!-- main-layout.component.html -->
<app-header [folioNumber]="activeFolio()" ... />
@if (isFolioRoute()) {
  <app-stepper [folio]="activeFolio()!" [sections]="quoteState()?.sections" ... />
}
<router-outlet />
@if (isFolioRoute()) {
  <app-status-bar [state]="quoteState()!" />
}
```

#### Rutas del cotizador

```typescript
// features/cotizador/cotizador.routes.ts
export const COTIZADOR_ROUTES: Routes = [
  { path: '',           component: CotizadorDashboardPage },
  {
    path: 'quotes/:folio',
    component: MainLayoutComponent,
    children: [
      { path: 'general-info',         component: GeneralInfoPage },
      { path: 'layout',               component: LayoutPage },
      { path: 'locations',            component: LocationsPage },
      { path: 'technical-info',       component: TechnicalInfoPage },
      { path: 'terms-and-conditions', component: TermsPage },
    ]
  }
];
```

> **Nota:** Las páginas hijas (`GeneralInfoPage`, `LocationsPage`, etc.) son stubs vacíos en esta spec; se implementarán en sus respectivas features. Solo se registran las rutas.

#### Átomos reutilizados de SPEC-001

| Átomo | Uso en este feature |
|-------|---------------------|
| `StatusBadgeComponent` | `StatusBarComponent` — muestra `quoteStatus` |
| `SparklineComponent` | `StatusBarComponent` — barra de progreso `completionPercentage` |
| `BtnComponent` | `NewFolioModalComponent` — botones Cancelar / Crear folio |
| `SelectComponent` | `NewFolioModalComponent` — Select suscriptor y Select agente |
| `IconComponent` | `StepperComponent` — íconos check y alerta por paso |

### Arquitectura y Dependencias

- `MainLayoutComponent` inyecta `Router`, `ActivatedRoute`, `QuoteStateService`
- `AppHeaderComponent` recibe el folio vía `@Input()` desde `MainLayoutComponent`
- `StepperComponent` recibe sections y folio como `@Input()`, navega con `Router`
- `StatusBarComponent` recibe `QuoteState` completo como `@Input()`
- `NewFolioModalComponent` inyecta `FolioService` y `CatalogService`; usa `@Output` para comunicar resultado a la page
- Los services son `providedIn: 'root'` y usan `inject(HttpClient)` + `inject(AppConfigService)`

### Notas de Implementación

- `MainLayoutComponent` usa `toSignal()` de `@angular/core/rxjs-interop` para reactividad con el router.
- La detección de ruta de folio se hace con `router.url.includes('/quotes/')` — no se usa un servicio de estado global para evitar acoplamiento.
- Los catálogos (`subscribers`, `agents`) deben cachearse para la duración de la sesión; usar `shareReplay(1)` en el observable.
- El filtrado de agentes por suscriptor se hace con `Array.filter()` sobre la lista cacheada, no con una nueva petición HTTP.
- El `QuoteStateService` puede ser llamado periódicamente (polling) o una sola vez por navegación; la frecuencia de actualización se define en la feature del Stepper.

---

## 3. LISTA DE TAREAS

> Checklist accionable. Marcar cada ítem (`[x]`) al completarlo. Una tarea = un issue cerrado.

### Modelos

- [x] Crear `src/app/core/models/folio.model.ts` — interfaces `FolioResponse`, `QuoteState`, `QuoteStatus`, `SectionStatus`, `StepStatus`, `StepDefinition`
- [x] Crear `src/app/core/models/catalog.model.ts` — interfaces `Subscriber`, `Agent`

### Services (TDD — test antes de implementación)

- [x] **RED** Crear `folio.service.spec.ts` — tests: `crearFolio()` happy path 201, idempotente 200, error 400
- [x] **GREEN** Crear `folio.service.ts` — `crearFolio(subscriberId, agentCode): Observable<FolioResponse>`
- [x] **RED** Crear `quote-state.service.spec.ts` — tests: `obtenerEstado()` happy path, folio no encontrado 404
- [x] **GREEN** Crear `quote-state.service.ts` — `obtenerEstado(folio): Observable<QuoteState>`
- [x] **RED** Crear `catalog.service.spec.ts` — tests: `obtenerSuscriptores()` lista, `obtenerAgentes()` lista con `shareReplay`
- [x] **GREEN** Crear `catalog.service.ts` — `obtenerSuscriptores()` y `obtenerAgentes()` con caché `shareReplay(1)`

### Organisms

- [x] Crear `app-header.component` (ts + html + scss) — logo, breadcrumb condicional, buscador, avatar
- [x] Crear `stepper.component` (ts + html + scss) + `stepper.steps.ts` — 5 pasos con estados e íconos
- [x] Crear `status-bar.component` (ts + html + scss) — folio, StatusBadge, Sparkline, porcentaje, ubicaciones, versión, timestamp
- [x] Crear `new-folio-modal.component` (ts + html + scss) — Select suscriptor + agente filtrado, Btn Crear/Cancelar, alerta informativa

### Template

- [x] Crear `main-layout.component` (ts + html + scss) — router-outlet + visibilidad condicional de Stepper y StatusBar mediante señal de ruta

### Rutas

- [x] Crear `src/app/features/cotizador/cotizador.routes.ts` — rutas `''` (dashboard) y `quotes/:folio/*` con hijos stub
- [x] Registrar `COTIZADOR_ROUTES` lazy en `app.routes.ts` bajo el path `/cotizador`

### QA

- [x] Ejecutar `/risk-identifier` → clasificación ASD del feature app-shell
- [x] Ejecutar `/gherkin-case-generator` → escenarios detallados para CRITERIO-1.1 a 5.1
- [x] Verificar cobertura ≥ 80% en los tres services (Jasmine) — 100% (23/23 tests)
- [x] Verificar que el Stepper refleja cambios de `QuoteState` en tiempo real al navegar entre pasos
- [x] Verificar CRITERIO-4.4: respuesta 200 idempotente navega igual que 201
- [x] Actualizar estado spec a `status: IMPLEMENTED` al completar todas las tareas
