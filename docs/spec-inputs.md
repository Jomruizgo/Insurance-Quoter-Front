# Inputs para el agente `spec-generator` — Frontend Sofka IQ

Cada sección es un input completo y copiable. Pásalo directamente al agente `spec-generator` (invoca con `/generate-spec`).

## Documentos de referencia obligatorios

| Documento | Ruta | Propósito |
|-----------|------|-----------|
| Reto técnico | `docs/Sofka IQ/uploads/Reto.md` | Alcance funcional, reglas de negocio, criterios de aceptación globales |
| Contratos de API | `docs/Sofka IQ/uploads/api-contracts.md` | Contratos HTTP exactos (URLs, request/response, códigos de error) |

## Archivos del prototipo de referencia

El prototipo está en `docs/Sofka IQ/` dentro de `Insurance-Quoter-Front/`. Los archivos clave son:

| Archivo | Contiene |
|---------|----------|
| `src/primitives.jsx` | Átomos: Icon, Btn, Badge, Field, Input, Select, Switch, StatusBadge |
| `src/shell.jsx` | AppHeader, Stepper, StatusBar, NewFolioModal |
| `src/dashboard.jsx` | Dashboard, StatCard |
| `src/steps-1-2.jsx` | GeneralInfo, LayoutStep |
| `src/steps-locations.jsx` | LocationsStep, LocationDrawer |
| `src/steps-calc.jsx` | CoverageStep, CalculateStep |
| `src/seed.js` | Datos de dominio, cálculo de prima, catálogos |

## Rutas de la SPA (fuente de verdad: CLAUDE.md + Reto)

```
/cotizador                           → Dashboard — selección / creación de folio
/quotes/:folio/general-info          → Paso 1: datos generales
/quotes/:folio/locations             → Paso 2 + 3: layout de ubicaciones + registro de ubicaciones
/quotes/:folio/technical-info        → Paso 4 + 5: coberturas + cálculo de prima
/quotes/:folio/terms-and-conditions  → Paso 6: términos, condiciones y finalización del folio
```

**Decisiones de routing:**
- El layout (paso 2 del prototipo) se integra dentro de `/quotes/:folio/locations` como sub-paso o tab — no tiene ruta propia.
- El cálculo (paso 5 del prototipo) va en `/quotes/:folio/technical-info` junto a coberturas, o como sub-vista de esa ruta. El spec-generator decide la estructura de tabs/sub-pasos.
- `/quotes/:folio/terms-and-conditions` es una pantalla nueva no presente en el prototipo (ver Input 9). El Reto la exige explícitamente como ruta funcional.

---

## Input 1 — Sistema de diseño (Atoms)

```
Necesito que generes una spec técnica ASDD para el feature "design-system-atoms" del frontend.

**Antes de cualquier otra acción**, crea una rama de Git siguiendo GitFlow:
1. Ejecuta `git fetch origin` para tener la última versión de `develop`.
2. Crea la rama desde el HEAD actualizado de develop: `git checkout -b feature/FE-01-design-system-atoms origin/develop`.
3. Trabaja en esa rama durante toda la generación de la spec.

**Descripción del feature:**
Sistema de diseño base (nivel Atom de Atomic Design) que define todos los bloques de construcción visuales reutilizables del cotizador. Sin este sistema, ningún otro feature de UI puede implementarse.

**Átomos a especificar** (extraídos de `docs/Sofka IQ/src/primitives.jsx`):
- `IconComponent` — sprite SVG inline. Catálogo de íconos: file, plus, search, filter, check, x, edit, trash, dots, alert, info, check-circle, x-circle, map-pin, calculator, shield, layers, arrow-right, arrow-left, download, copy, sparkle, cog, clock, eye, grid, list.
- `BtnComponent` — botón con variantes (`primary`, `secondary`, `ghost`) y tamaños (`sm`, `xs`). Puede llevar icono izquierdo y/o derecho. Estado `disabled`.
- `BadgeComponent` — etiqueta de estado con variantes: `ok`, `warn`, `info`, `brand` y neutro. Soporte para `dot` de color.
- `StatusBadgeComponent` — badge especializado para los estados del folio: `CREATED`, `IN_PROGRESS`, `CALCULATED`, `ISSUED`.
- `FieldComponent` — wrapper de campo de formulario: label, indicador de requerido (*), mensaje de ayuda, mensaje de error con ícono.
- `InputComponent`, `SelectComponent`, `TextareaComponent` — controles nativos con clase CSS unificada.
- `SwitchComponent` — toggle accesible (role="switch", aria-checked, soporte teclado Enter/Space).
- `SectionHeaderComponent` — cabecera de sección con eyebrow, title, subtitle y slot de acciones.
- `SparklineComponent` — barra de progreso horizontal (0-100%).
- `StatCardComponent` — tarjeta de estadística con label, valor grande, subtexto y acento de color por tono (brand, info, neutral).

**Tokens de diseño** (`docs/Sofka IQ/src/tokens.css`):
- Variables CSS: `--brand-*`, `--ink-*`, `--text`, `--text-dim`, `--text-mute`, `--border`, `--surface`, `--surface-2`, `--bg`
- Temas: `data-theme="light"` / `data-theme="dark"`
- Densidades: `data-density="compact"` / `standard` / `cozy`
- Colores primarios intercambiables: lime, teal, indigo, amber (`data-primary`)

**Stack:** Angular 19 standalone components, TypeScript strict, SCSS con custom properties (no CSS Modules).

**Carpeta objetivo:** `src/app/shared/ui/atoms/`

**Sin tests de componentes.** Los átomos no tienen lógica de negocio; no aplica TDD.

**Contratos API:** Ninguno. Son componentes puramente visuales.

**Criterios de aceptación mínimos:**
- Todos los átomos aceptan `@Input()` para sus props y emiten `@Output()` para eventos.
- El sistema de tokens funciona con los 4 temas de color y 3 densidades.
- Los componentes son accesibles (atributos ARIA donde corresponde).
```

---

## Input 2 — Shell de la aplicación

```
Necesito que generes una spec técnica ASDD para el feature "app-shell" del frontend.

**Antes de cualquier otra acción**, crea una rama de Git siguiendo GitFlow:
1. Ejecuta `git fetch origin` para tener la última versión de `develop`.
2. Crea la rama desde el HEAD actualizado de develop: `git checkout -b feature/FE-02-app-shell origin/develop`.
3. Trabaja en esa rama durante toda la generación de la spec.

**Descripción del feature:**
Layout estructural de la aplicación: componentes de nivel "Template" y "Organism" que forman el esqueleto visible en todas las pantallas del cotizador.

**Componentes a especificar** (extraídos de `docs/Sofka IQ/src/shell.jsx`):

1. `AppHeaderComponent` (Organism)
   - Logo "IQ" + marca "Sofka IQ / Cotizador de Daños"
   - Breadcrumb dinámico: "Cotizaciones" (siempre) → número de folio (solo cuando hay folio activo)
   - Buscador con placeholder "Buscar…" y atajo de teclado visual (⌘K)
   - Avatar del usuario con nombre y rol (ej. "Laura T. / Suscriptor")
   - Sticky en top: 0, z-index 30

2. `StepperComponent` (Organism)
   - 5 pasos: Datos generales, Layout, Ubicaciones, Coberturas, Cálculo
   - Cada paso muestra: número o ícono check (si completó), label, ícono de alerta si está INCOMPLETE
   - Estados por paso: `PENDING` | `INCOMPLETE` | `COMPLETE`
   - Sticky debajo del header (top: 56px), solo visible en ruta de folio
   - Clic en un paso navega directamente a él

3. `StatusBarComponent` (Organism)
   - Sticky en bottom: 0, visible solo en ruta de folio
   - Muestra: número de folio, StatusBadge del estado, barra de progreso (Sparkline), % de completitud, "X/Y ubicaciones completas", versión del folio, timestamp de último guardado

4. `NewFolioModalComponent` (Organism)
   - Modal centrado con backdrop
   - Campos: Select suscriptor, Select agente (filtrado por suscriptor seleccionado)
   - Alerta informativa: "POST /v1/folios — endpoint idempotente"
   - Botones: Cancelar / Crear folio
   - Al crear: llama al servicio de folios y navega al paso "Datos generales"

5. `MainLayoutComponent` (Template)
   - Envuelve: AppHeader + Stepper (condicional) + `<router-outlet>` + StatusBar (condicional)
   - Controla la lógica de visibilidad: mostrar Stepper y StatusBar solo cuando la ruta es de folio

**Servicio requerido (TDD obligatorio):**
- `FolioService.crearFolio(subscriberId, agentCode)` → `Observable<FolioResponse>`
  - POST `/v1/folios` con body `{ subscriberId, agentCode }`
  - Respuesta 201 (nuevo) o 200 (idempotente, mismo folio sin cotización iniciada)
- `QuoteStateService.obtenerEstado(folio)` → `Observable<QuoteState>`
  - GET `/v1/quotes/{folio}/state` — alimenta el Stepper y el StatusBar con el % de completitud y el estado de cada sección (`PENDING` | `INCOMPLETE` | `COMPLETE`)

**Contratos API:** `docs/Sofka IQ/uploads/api-contracts.md` → secciones 1 (Folios) y 5 (Estado de Cotización).

**Rutas:**
- `/cotizador` → Dashboard (sin Stepper ni StatusBar)
- `/quotes/:folio/general-info` → activa Stepper y StatusBar

**Criterios de aceptación mínimos:**
- El Stepper obtiene el estado de cada sección desde `GET /v1/quotes/{folio}/state` y lo refleja en tiempo real.
- El StatusBar muestra el `completionPercentage` y el `quoteStatus` del folio activo.
- El modal de nuevo folio cierra y navega a `/quotes/:folio/general-info` al crear exitosamente.
- `FolioService` y `QuoteStateService` tienen cobertura ≥ 80% con tests Jasmine.
```

---

## Input 3 — Dashboard (panel de folios)

```
Necesito que generes una spec técnica ASDD para el feature "dashboard" del frontend.

**Antes de cualquier otra acción**, crea una rama de Git siguiendo GitFlow:
1. Ejecuta `git fetch origin` para tener la última versión de `develop`.
2. Crea la rama desde el HEAD actualizado de develop: `git checkout -b feature/FE-03-dashboard origin/develop`.
3. Trabaja en esa rama durante toda la generación de la spec.

**Descripción del feature:**
Pantalla principal del cotizador. Muestra el inventario de folios activos con métricas resumidas, filtros, búsqueda y dos modos de visualización (lista y cuadrícula).

**Componentes a especificar** (extraídos de `docs/Sofka IQ/src/dashboard.jsx`):

1. `DashboardPage` (Page / route component)
   - Compone StatCards + tabla/grid de folios
   - Consume `FolioService.listarFolios()` vía async pipe
   - Botón "Nuevo folio" abre `NewFolioModalComponent`
   - Botón "Exportar" (visual, sin implementación en esta fase)

2. `FolioSummaryTableComponent` (Organism)
   - Tabla con columnas: Folio (mono), Cliente, Agente (código + nombre), Estado (StatusBadge), Ubicaciones (número), Progreso (Sparkline + %), Prima comercial (dinero), Actualizado (fecha)
   - Clic en fila navega al folio: `/quotes/:folio/general-info`
   - Checkbox de selección múltiple por fila (visual en esta fase)
   - Botón de opciones por fila (menú contextual — visual)

3. `FolioSummaryGridComponent` (Organism)
   - Tarjetas en cuadrícula 3 columnas
   - Cada tarjeta: folio (mono), cliente, agente + ubicaciones, Sparkline de progreso, fecha, prima comercial
   - StatusBadge en esquina superior derecha

4. `FolioFiltersComponent` (Molecule)
   - Input de búsqueda (por folio o cliente)
   - Select de estado: Todos / Creado / En progreso / Calculado / Emitido
   - Botón "Más filtros" (visual)
   - Toggle lista/cuadrícula

**Lógica de filtrado (en el servicio o en el componente según spec):**
- Filtro de texto: `folioNumber` o `client` contiene la cadena (case-insensitive)
- Filtro de estado: coincidencia exacta o "ALL"

**Métricas del header (StatCards):**
- Folios totales (últimos 30 días)
- En progreso (requieren atención)
- Calculados + Emitidos (listos para emisión)
- Prima comercial acumulada (suma de folios calculados)

**Contratos API:** `docs/Sofka IQ/uploads/api-contracts.md` → sección 1 (GET /v1/folios si existe).

**Ruta:** `/cotizador` (sin parámetros)

**Criterios de aceptación mínimos:**
- Los filtros de búsqueda y estado se aplican en tiempo real (sin petición adicional al backend).
- Los modos lista y cuadrícula son intercambiables sin perder el estado de filtros.
- Las métricas del header se calculan a partir de la misma lista de folios.
- Clic en cualquier fila/tarjeta navega correctamente al folio.
```

---

## Input 4 — Paso 1: Datos generales

```
Necesito que generes una spec técnica ASDD para el feature "quote-general-info" del frontend.

**Antes de cualquier otra acción**, crea una rama de Git siguiendo GitFlow:
1. Ejecuta `git fetch origin` para tener la última versión de `develop`.
2. Crea la rama desde el HEAD actualizado de develop: `git checkout -b feature/FE-04-general-info origin/develop`.
3. Trabaja en esa rama durante toda la generación de la spec.

**Descripción del feature:**
Paso 1 de 5 del wizard de cotización. Captura los datos del asegurado (persona moral/física) y los datos de suscripción (suscriptor, agente, clasificación de riesgo, tipo de negocio).

**Componentes a especificar** (extraídos de `docs/Sofka IQ/src/steps-1-2.jsx`):

1. `GeneralInfoPage` (Page)
   - Cabecera: `SectionHeader` con "Folio FOL-XXXX · Paso 1 de 5" + título "Datos generales"
   - Consume el folio activo desde `QuoteStateService` o vía resolución de ruta

2. `InsuredDataFormComponent` (Organism)
   - Grid 2 columnas: Razón social*, RFC* (mono, 13 chars), Correo de contacto*, Teléfono*
   - Badge de completitud en el header de la tarjeta
   - Validaciones: RFC formato (persona moral / física), email válido, teléfono solo dígitos

3. `UnderwritingDataFormComponent` (Organism)
   - Grid 2 columnas: Select Suscriptor*, Select Agente* (filtrado por suscriptor), Select Clasificación de riesgo*, Select Tipo de negocio*
   - Alerta informativa inline: "Versionado optimista activo — versión actual: vN"

**Catálogos requeridos (del Core):**
- Suscriptores: GET `/v1/subscribers` (o catálogo local inicial si no existe endpoint)
- Agentes: GET `/v1/agents?subscriberId=X`
- Clasificaciones de riesgo: `STANDARD`, `PREFERRED`, `SUBSTANDARD`
- Tipos de negocio: `COMMERCIAL`, `INDUSTRIAL`, `RESIDENTIAL`

**Servicio requerido (TDD obligatorio):**
- `GeneralInfoService.guardar(folio, insuredData, underwritingData, version)` → `Observable<QuoteResponse>`
  - **PUT** `/v1/quotes/{folio}/general-info` con body `{ insuredData, underwritingData, version }`
  - Error 409 `VERSION_CONFLICT` si la versión no coincide — el servicio debe propagarlo
- `GeneralInfoService.cargar(folio)` → `Observable<GeneralInfoResponse>`
  - GET `/v1/quotes/{folio}/general-info`

**Contratos API:** `docs/Sofka IQ/uploads/api-contracts.md` → sección 2 (Datos Generales).

**Ruta:** `/quotes/:folio/general-info`

**Criterios de aceptación mínimos:**
- El campo RFC fuerza mayúsculas al tipear.
- El select de agentes se filtra dinámicamente al cambiar el suscriptor.
- Al guardar, el campo `version` del folio se incrementa y se refleja en el StatusBar.
- Los campos obligatorios muestran error si están vacíos al intentar avanzar.
- Cobertura ≥ 80% en `GeneralInfoService` con tests Jasmine.
```

---

## Input 5 — Paso 2: Layout de ubicaciones

```
Necesito que generes una spec técnica ASDD para el feature "quote-layout-config" del frontend.

**Antes de cualquier otra acción**, crea una rama de Git siguiendo GitFlow:
1. Ejecuta `git fetch origin` para tener la última versión de `develop`.
2. Crea la rama desde el HEAD actualizado de develop: `git checkout -b feature/FE-05-layout-config origin/develop`.
3. Trabaja en esa rama durante toda la generación de la spec.

**Descripción del feature:**
Paso 2 de 5 del wizard. El usuario define cuántas ubicaciones tendrá el folio y qué tipo de distribución tienen (única, múltiple, distribuida). Esta configuración sirve de plantilla para el paso siguiente.

**Componentes a especificar** (extraídos de `docs/Sofka IQ/src/steps-1-2.jsx`):

1. `LayoutConfigPage` (Page)
   - Cabecera: "Folio FOL-XXXX · Paso 2 de 5" + título "Layout de ubicaciones"

2. `LayoutConfigFormComponent` (Organism)
   - Grid 2 columnas:
     - Input numérico "Número de ubicaciones" (1–50, obligatorio)
     - Selector de tipo de ubicación con radio cards visuales:
       - `SINGLE` → "Ubicación única"
       - `MULTIPLE` → "Múltiples ubicaciones"
       - `DISTRIBUTED` → "Distribuida"
   - Radio card: resalta con borde de color primario + ícono check-circle cuando está seleccionado
   - Texto informativo: "Este layout se replicará como plantilla al registrar ubicaciones"

**Servicio requerido (TDD obligatorio):**
- `LayoutConfigService.guardar(folio, layoutConfiguration, version)` → `Observable<LayoutConfigResponse>`
  - PUT `/v1/quotes/{folio}/locations/layout` con body `{ "layoutConfiguration": { numberOfLocations, locationType }, "version": N }`
  - Error 409 `VERSION_CONFLICT` si la versión no coincide
- `LayoutConfigService.cargar(folio)` → `Observable<LayoutConfigResponse>`
  - GET `/v1/quotes/{folio}/locations/layout`

**Contratos API:** `docs/Sofka IQ/uploads/api-contracts.md` → sección 3 (Layout de Ubicaciones).

**Ruta:** `/quotes/:folio/locations` (el layout es un sub-paso o tab dentro de la ruta de ubicaciones, no una ruta propia — ver nota en el encabezado de este documento).

**Criterios de aceptación mínimos:**
- El input numérico no acepta valores fuera del rango 1–50.
- Los radio cards muestran feedback visual al seleccionarse.
- El step "Layout" en el Stepper pasa a estado `COMPLETE` al guardar con datos válidos.
- Cobertura ≥ 80% en `LayoutConfigService` con tests Jasmine.
```

---

## Input 6 — Paso 3: Ubicaciones de riesgo

```
Necesito que generes una spec técnica ASDD para el feature "quote-locations" del frontend.

**Antes de cualquier otra acción**, crea una rama de Git siguiendo GitFlow:
1. Ejecuta `git fetch origin` para tener la última versión de `develop`.
2. Crea la rama desde el HEAD actualizado de develop: `git checkout -b feature/FE-06-locations origin/develop`.
3. Trabaja en esa rama durante toda la generación de la spec.

**Descripción del feature:**
Paso 3 de 5. Gestión completa de las ubicaciones de riesgo del folio. Es el paso más complejo del wizard: incluye una tabla de ubicaciones y un drawer de edición con 4 pestañas.

**Componentes a especificar** (extraídos de `docs/Sofka IQ/src/steps-locations.jsx`):

1. `LocationsPage` (Page)
   - Cabecera con contador: "X de Y ubicaciones registradas · Z completas · N con alertas"
   - Botón "Añadir ubicación" (crea una ubicación nueva en estado INCOMPLETE)
   - Botón "Duplicar" (visual)

2. `LocationsAlertBannerComponent` (Molecule)
   - Alert `warn` visible cuando hay ubicaciones con alertas bloqueantes
   - Muestra el conteo y el mensaje de impacto al cálculo
   - Botón "Ver detalles"

3. `LocationsTableComponent` (Organism)
   - Columnas: checkbox, #, Nombre, Dirección·CP, Giro (código + clave incendio), Construcción (tipo + nivel + año), Suma asegurada, Estado, Acciones
   - Checkbox de selección múltiple (header selecciona todo)
   - Fila con `data-state="selected"` para estilo visual
   - Fila clickeable → abre el `LocationDrawerComponent`
   - Fila en error: CP en rojo si falta, clave incendio en rojo si falta
   - Footer: suma total asegurada
   - Botón "Exportar CSV" (visual)
   - Bloque vacío al pie: "+ Añadir N ubicaciones restantes" si faltan por registrar

4. `LocationDrawerComponent` (Organism — panel lateral)
   - Header: número de ubicación (mono), Badge COMPLETE/INCOMPLETE+contador alertas, nombre, botón X
   - 4 pestañas:
     a. **Datos básicos**: nombre de ubicación*, dirección*, CP* (con auto-fill de estado/municipio/ciudad/colonia desde catálogo), select de colonia, campos municipio/estado (readonly), badge de zona catastrófica (TEV + FHM + ZONE)
     b. **Construcción**: tipo constructivo (radio cards 5 opciones: Mampostería, Estructura metálica, Concreto armado, Madera, Mixto), número de niveles* (1–50), año de construcción* (1900–2026)
     c. **Giro**: Select de giro/línea de negocio → al seleccionar muestra card con código, descripción y clave incendio resueltos
     d. **Garantías**: lista de 6 garantías (Incendio edificios, Incendio contenidos, Robo con violencia, Vidrios, Equipo electrónico, Dinero y valores), cada una con checkbox toggle + input de suma asegurada MXN; footer con suma total
   - Footer del drawer: alertas bloqueantes activas + "vN → vN+1" + botones Cancelar / Guardar ubicación
   - **Validación en tiempo real:**
     - CP: requerido y debe existir en catálogo (MISSING_ZIP_CODE)
     - Giro: clave incendio requerida (MISSING_FIRE_KEY)
     - Garantías: al menos una tarifable con suma > 0 (NO_TARIFABLE)

**Catálogos requeridos:**
- CP lookup: GET `/v1/zip-codes/{zipCode}` → `{ state, municipality, city, neighborhoods[], catastrophicZone, tevZone, fhmZone }`
- Giros: GET `/v1/business-lines` → `[{ code, description, fireKey }]`
- Tipos constructivos: `MASONRY`, `STEEL`, `CONCRETE`, `WOOD`, `MIXED`
- Garantías: `GUA-FIRE`, `GUA-CONT`, `GUA-THEFT`, `GUA-GLASS`, `GUA-ELEC`, `GUA-CASH`

**Servicios requeridos (TDD obligatorio):**
- `LocationService.listar(folio)` → `Observable<LocationsResponse>` — GET `/v1/quotes/{folio}/locations`
- `LocationService.obtenerResumen(folio)` → `Observable<LocationsSummary>` — GET `/v1/quotes/{folio}/locations/summary` (usado por el banner de alertas; más ligero que cargar todas las ubicaciones)
- `LocationService.reemplazarLista(folio, locations, version)` → `Observable<LocationsResponse>` — PUT `/v1/quotes/{folio}/locations`
- `LocationService.actualizarParcial(folio, index, fields, version)` → `Observable<LocationResponse>` — PATCH `/v1/quotes/{folio}/locations/{index}`
- `ZipCodeService.buscar(zipCode)` → `Observable<ZipCodeInfo>` — GET `/v1/zip-codes/{zipCode}` (error 404 = `ZIP_CODE_NOT_FOUND`)
- `CatalogService.obtenerGiros()` → `Observable<BusinessLine[]>` — GET `/v1/business-lines`

**Contratos API:** `docs/Sofka IQ/uploads/api-contracts.md` → sección 4 (Ubicaciones) y sección 8 (catálogos core).

**Ruta:** `/quotes/:folio/locations` (incluye el sub-paso de layout — ver nota en el encabezado).

**Criterios de aceptación mínimos:**
- Al ingresar un CP válido (del catálogo), los campos municipio, estado y ciudad se rellenan automáticamente y el campo colonia presenta las opciones del catálogo.
- Al seleccionar un giro, la clave incendio se muestra en la card de confirmación.
- El LocationDrawer revalida alertas en tiempo real al modificar cualquier campo.
- "Guardar ubicación" incrementa la versión del folio en 1.
- Las ubicaciones INCOMPLETE no bloquean el guardado de las COMPLETE.
- Cobertura ≥ 80% en `LocationService` y `ZipCodeService` con tests Jasmine.
```

---

## Input 7 — Paso 4: Coberturas por ubicación

```
Necesito que generes una spec técnica ASDD para el feature "quote-coverages" del frontend.

**Antes de cualquier otra acción**, crea una rama de Git siguiendo GitFlow:
1. Ejecuta `git fetch origin` para tener la última versión de `develop`.
2. Crea la rama desde el HEAD actualizado de develop: `git checkout -b feature/FE-07-coverages origin/develop`.
3. Trabaja en esa rama durante toda la generación de la spec.

**Descripción del feature:**
Paso 4 de 5. El usuario configura las opciones de cobertura (deducibles y coaseguros) de forma independiente por cada ubicación del folio. Permite copiar la configuración entre ubicaciones.

**Componentes a especificar** (extraídos de `docs/Sofka IQ/src/steps-calc.jsx`, función `CoverageStep`):

1. `CoveragesPage` (Page)
   - Cabecera: "Folio FOL-XXXX · Paso 4 de 5" + título "Opciones de cobertura por ubicación"

2. `LocationTabSelectorComponent` (Molecule)
   - Tira horizontal scrollable de tabs, una por ubicación
   - Cada tab: "UBIC 01", nombre de la ubicación, contador "N/M coberturas activas"
   - Tab activa con fondo y borde de color primario
   - Botón "Aplicar a todas" (solo habilitado si hay > 1 ubicación)

3. `CoverageContextBarComponent` (Molecule)
   - Muestra: nombre de la ubicación activa, "X de Y coberturas activas"
   - Select "Copiar desde:" con las demás ubicaciones (solo visible si hay > 1)

4. `CoverageOptionsGridComponent` (Organism)
   - Grid 2 columnas de `CoverageCardComponent`

5. `CoverageCardComponent` (Molecule)
   - Header con Switch toggle + nombre de cobertura + código mono + Badge "Activa" si está encendida
   - Header con fondo tintado (color primario al 7%) cuando está activa
   - Body: 2 campos numéricos — Deducible (%) con step 0.5, Coaseguro (%) con step 5
   - Body deshabilitado (opacity 0.5, pointer-events none) cuando el switch está apagado

**Coberturas del catálogo:**
- `COV-FIRE` — Incendio y riesgos adicionales (deducible 2%, coaseguro 80%)
- `COV-CAT` — Cobertura catastrófica CATTEV/CATFHM (ded. 3%, coas. 90%)
- `COV-THEFT` — Robo con violencia (ded. 5%, coas. 100%)
- `COV-BI` — Pérdida de rentas / BI (ded. 3%, coas. 80%)
- `COV-ELEC` — Equipo electrónico (ded. 10%, coas. 100%)
- `COV-GLASS` — Vidrios (ded. 5%, coas. 100%)

**IMPORTANTE — Diferencia entre prototipo y contrato API:**
El prototipo modela coberturas *por ubicación* (`coveragesByLocation: { [index]: CoverageOption[] }`), pero el contrato HTTP real (`api-contracts.md` sección 6) almacena un único array `coverageOptions[]` **a nivel de folio**, no por ubicación. La spec debe seguir el contrato de API. El selector de ubicaciones del prototipo es un patrón de UX para editar el mismo array global desde la perspectiva de cada ubicación, pero la persistencia es flat.

**Lógica de cobertura (ajustada al contrato):**
- La API persiste un único `coverageOptions[]` para todo el folio
- El selector de ubicaciones en la UI es navegación visual, no datos separados
- "Aplicar a todas" y "Copiar desde" son operaciones de UI sobre el mismo array compartido
- Al inicializar: si el folio no tiene `coverageOptions`, obtenerlos del catálogo de garantías

**Servicio requerido (TDD obligatorio):**
- `CoverageService.obtener(folio)` → `Observable<CoverageOptionsResponse>`
  - GET `/v1/quotes/{folio}/coverage-options`
- `CoverageService.guardar(folio, coverageOptions, version)` → `Observable<CoverageOptionsResponse>`
  - PUT `/v1/quotes/{folio}/coverage-options` con body `{ "coverageOptions": [...], "version": N }`
  - Cada item: `{ code, selected, deductiblePercentage, coinsurancePercentage }`

**Contratos API:** `docs/Sofka IQ/uploads/api-contracts.md` → sección 6 (Opciones de Cobertura).

**Ruta:** `/quotes/:folio/technical-info`

**Criterios de aceptación mínimos:**
- Cambiar de tab de ubicación preserva el estado de la ubicación anterior.
- "Aplicar a todas" replica exactamente (deep clone) la configuración.
- Desactivar un switch desactiva visualmente el body de la card.
- Los valores de deducible y coaseguro se guardan por cobertura y por ubicación de forma independiente.
- Cobertura ≥ 80% en `CoverageService` con tests Jasmine.
```

---

## Input 8 — Paso 5: Cálculo de prima

```
Necesito que generes una spec técnica ASDD para el feature "quote-calculation" del frontend.

**Antes de cualquier otra acción**, crea una rama de Git siguiendo GitFlow:
1. Ejecuta `git fetch origin` para tener la última versión de `develop`.
2. Crea la rama desde el HEAD actualizado de develop: `git checkout -b feature/FE-08-calculation origin/develop`.
3. Trabaja en esa rama durante toda la generación de la spec.

**Descripción del feature:**
Paso 5 del wizard. El usuario ejecuta el cálculo de prima del folio y visualiza el desglose financiero completo por componente técnico y por ubicación. Esta pantalla es previa a la aceptación de términos y condiciones (feature FE-09).

**Dos estados de la pantalla** (extraídos de `docs/Sofka IQ/src/steps-calc.jsx`, función `CalculateStep`):

**Estado A — Pre-cálculo:**
1. `CalculationTriggerComponent` (Organism)
   - Ícono de calculadora centrado
   - Mensaje: "Se calcularán N ubicaciones completas. Las M incompletas generarán alerta pero no bloquearán el proceso."
   - Badges: "{N} calculables" (verde) y "{M} con alertas" (amarillo, si aplica)
   - Botón "Ejecutar cálculo" (primario, deshabilitado si calculables === 0)

**Estado B — Resultado del cálculo:**
2. `PremiumSummaryComponent` (Organism — 3 cards en el top)
   - Card oscura: Prima neta (MXN con decimales)
   - Card color primario: Prima comercial (neta × 1.16)
   - Card neutral: Prima por ubicación (lista con índice, nombre, monto comercial o badge "No calculable")

3. `PremiumBreakdownTableComponent` (Organism)
   - Columnas: Componente | [una col por ubicación calculable] | Total
   - Filas (14 componentes técnicos): Incendio edificios, Incendio contenidos, Extensión de cobertura, CATTEV, CATFHM, Remoción de escombros, Gastos extraordinarios, Pérdida de rentas, BI, Equipo electrónico, Robo, Dinero y valores, Vidrios, Anuncios luminosos
   - Fila de totales: Prima neta por ubicación (bold)
   - Celda "Total" con fondo distinto
   - Celdas con valor 0 o nulo muestran "—" en color muted

4. `IncompleteLocationsAlertComponent` (Molecule)
   - Alert `warn` solo visible si hay ubicaciones no calculables
   - Lista cada ubicación con sus alertas bloqueantes

**Cabecera del resultado:**
- Eyebrow: "Folio FOL-XXXX · Resultado"
- Acciones: "Descargar PDF", "Recalcular", "Continuar a términos y condiciones" (navega a `/quotes/:folio/terms-and-conditions`)

**Servicio requerido (TDD obligatorio):**
- `CalculationService.ejecutar(folio, version)` → `Observable<CalculationResult>`
  - POST `/v1/quotes/{folio}/calculate` con body `{ "version": N }`
  - Response: `{ folioNumber, quoteStatus: "CALCULATED", netPremium, commercialPremium, premiumsByLocation[], calculatedAt, version }`
  - Error 422 `NO_CALCULABLE_LOCATIONS` si TODAS las ubicaciones son incompletas
  - Error 409 `VERSION_CONFLICT` si la versión no coincide
- `QuoteStateService.obtenerEstado(folio)` → ya definido en Input 2 (Shell) — se reutiliza para actualizar el StatusBar tras el cálculo

**Contratos API:** `docs/Sofka IQ/uploads/api-contracts.md` → sección 7 (Cálculo de Prima).

**Ruta:** `/quotes/:folio/technical-info`

**Criterios de aceptación mínimos:**
- El botón "Ejecutar cálculo" se deshabilita si no hay ubicaciones calculables.
- Las ubicaciones INCOMPLETE no bloquean el cálculo de las COMPLETE.
- El desglose financiero muestra "—" para componentes con prima cero.
- La prima comercial visible es siempre neta × 1.16.
- Al completar el cálculo, el estado del folio cambia a `CALCULATED` en el StatusBar.
- El botón "Continuar a términos y condiciones" solo se habilita cuando `quoteStatus === 'CALCULATED'`.
- Cobertura ≥ 80% en `CalculationService` con tests Jasmine.
```

---

## Input 9 — Términos y condiciones

```
Necesito que generes una spec técnica ASDD para el feature "quote-terms-and-conditions" del frontend.

**Antes de cualquier otra acción**, crea una rama de Git siguiendo GitFlow:
1. Ejecuta `git fetch origin` para tener la última versión de `develop`.
2. Crea la rama desde el HEAD actualizado de develop: `git checkout -b feature/FE-09-terms-and-conditions origin/develop`.
3. Trabaja en esa rama durante toda la generación de la spec.

**Descripción del feature:**
Paso final del wizard de cotización. El Reto técnico exige esta ruta (`/quotes/:folio/terms-and-conditions`) pero el prototipo no la tiene implementada, por lo que esta spec debe diseñarla desde cero.

El usuario llega aquí después de ver el resultado del cálculo en `/quotes/:folio/technical-info`. Esta pantalla tiene dos responsabilidades:
1. Presentar un resumen ejecutivo de la cotización calculada (sin el desglose completo, que ya está en technical-info).
2. Requerir la aceptación explícita de términos y condiciones antes de cerrar/finalizar el folio.

**Componentes a diseñar (no existen en el prototipo — el spec-generator los define):**

1. `TermsAndConditionsPage` (Page)
   - Cabecera: "Folio FOL-XXXX · Términos y condiciones"
   - Acciones: "Volver al resultado" (navega a technical-info)

2. `QuoteSummaryCardComponent` (Organism)
   - Resumen ejecutivo de la cotización: folio, cliente, suscriptor, agente, número de ubicaciones, fecha de cálculo
   - Prima neta total, prima comercial total
   - Lista compacta de ubicaciones con su prima individual (solo las calculables)
   - Badge del estado: `CALCULATED`

3. `TermsAndConditionsTextComponent` (Organism)
   - Bloque de texto con las condiciones generales del seguro de daños
   - Debe ser scrollable con altura máxima fija
   - Condiciones mínimas a incluir (el spec-generator las redacta en español):
     a. Veracidad de la información proporcionada
     b. Vigencia y validez de la cotización (plazo en días — el spec-generator propone un valor razonable)
     c. Condiciones para la emisión efectiva de la póliza
     d. Tratamiento de datos personales (LFPDPPP — contexto mexicano)
     e. Limitaciones de cobertura según las garantías seleccionadas

4. `AcceptanceFormComponent` (Molecule)
   - Checkbox "He leído y acepto los términos y condiciones"
   - Checkbox "Declaro que la información proporcionada es verídica y completa"
   - Campo de nombre completo del representante/aceptante (text input, requerido)
   - Ambos checkboxes son obligatorios para habilitar el botón de aceptación

5. `QuoteFinalizationBarComponent` (Organism — barra de acción fija al pie)
   - Timestamp del cálculo: "Cotización calculada el DD MMM YYYY HH:mm"
   - Botón secundario: "Descargar PDF" (visual — dispara `window.print()` o similar en esta fase)
   - Botón primario: "Aceptar y finalizar cotización" — deshabilitado hasta que ambos checkboxes y el nombre estén completos

**Estado posterior a la aceptación:**
- El folio pasa de `CALCULATED` a `ISSUED`
- Se muestra un estado de confirmación inline (no modal): "Cotización finalizada · Folio FOL-XXXX"
- Botón "Volver al panel" → navega a `/cotizador`

**Nota sobre el backend:**
El Reto indica que el estado `ISSUED` existe en el dominio. Si no hay un endpoint explícito de aceptación en `api-contracts.md`, el spec-generator debe proponer el endpoint faltante (ej. `POST /v1/quotes/{folio}/accept`) como deuda técnica documentada y puede dejar el cambio de estado como optimista en el frontend para esta fase.

**Servicio requerido (TDD obligatorio):**
- `TermsService.aceptar(folio, acceptanceName, version)` → `Observable<QuoteResponse>`
  - Endpoint propuesto: POST `/v1/quotes/{folio}/accept` con body `{ "acceptedBy": "<nombre>", "version": N }`
  - Si el endpoint no existe aún, documentarlo como pendiente y mockear en el service
- `CalculationService.obtenerResultado(folio)` → `Observable<CalculationResult>` — reutilizado de FE-08 para el resumen ejecutivo

**Contratos API:** `docs/Sofka IQ/uploads/api-contracts.md` — no hay sección específica para aceptación; el spec-generator debe documentar el endpoint propuesto como extensión del contrato.

**Ruta:** `/quotes/:folio/terms-and-conditions`

**Criterios de aceptación mínimos (escenario del Reto, sección "Escenario de aceptación sugerido" paso 10):**
- El botón "Aceptar y finalizar" permanece deshabilitado hasta que ambos checkboxes están marcados y el nombre está completo.
- Al aceptar, el folio muestra el estado `ISSUED` en el StatusBar.
- El resumen ejecutivo muestra la prima calculada correctamente (consistente con lo mostrado en technical-info).
- La pantalla es accesible solo si el folio tiene `quoteStatus === 'CALCULATED'`; de lo contrario redirigir a technical-info.
- Cobertura ≥ 80% en `TermsService` con tests Jasmine.
```

---

## Orden de ejecución recomendado

Los specs deben generarse en este orden para evitar dependencias bloqueantes:

```
1. FE-01 (design-system-atoms)       → Base de todo lo demás
2. FE-02 (app-shell)                 → Layout global + servicios de folio
3. FE-03 (dashboard)                 → Primera pantalla funcional
4. FE-04 (general-info)              → Paso 1 (más simple, base del wizard)
5. FE-05 (layout-config)             → Paso 2 (integrado en /locations)
6. FE-06 (locations)                 → Paso 3 (más complejo, en paralelo con FE-07)
7. FE-07 (coverages)                 → Paso 4 (en paralelo con FE-06)
8. FE-08 (calculation)               → Paso 5 → ruta /technical-info
9. FE-09 (terms-and-conditions)      → Paso 6 (diseño desde cero, requiere resultado calculado)
```

Los specs 6 y 7 pueden generarse en paralelo. El 9 depende conceptualmente del 8 (necesita entender el resultado del cálculo para el resumen ejecutivo).

Los specs de pasos 6 y 7 pueden generarse en paralelo (son independientes entre sí). Los demás son secuenciales por dependencias de diseño.
