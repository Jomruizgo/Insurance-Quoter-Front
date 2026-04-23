---
id: SPEC-007
status: IMPLEMENTED
feature: quote-locations
created: 2026-04-22
updated: 2026-04-22
author: spec-generator
version: "1.0"
related-specs:
  - SPEC-006  # quote-layout-config (determina numberOfLocations)
  - SPEC-004  # quote-general-info
---

# Spec: Gestión de Ubicaciones de Riesgo (Paso 3/5)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Paso 3 del wizard de cotización. Permite al usuario registrar, editar y validar todas las ubicaciones de riesgo asociadas a un folio. Es el paso de mayor complejidad: incluye una tabla resumen con selección múltiple y un drawer lateral con 4 pestañas (Datos básicos, Construcción, Giro, Garantías). La validación ocurre en tiempo real y los datos se persisten por ubicación mediante PATCH optimista.

### Requerimiento de Negocio

El cotizador debe permitir capturar la información completa de cada ubicación asegurada (dirección, tipo constructivo, giro de negocio y valores garantizados). Cada ubicación puede quedar en estado `COMPLETE` o `INCOMPLETE` según las alertas bloqueantes. El cálculo de prima solo se bloquea si **todas** las ubicaciones son incompletas.

### Historias de Usuario

#### HU-01: Visualización y navegación de ubicaciones

```
Como:        Agente de cotización
Quiero:      Ver todas las ubicaciones del folio en una tabla con su estado de completitud
Para:        Identificar rápidamente cuáles ubicaciones requieren atención antes del cálculo

Prioridad:   Alta
Estimación:  M
Dependencias: SPEC-006 (layout define numberOfLocations)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Tabla muestra ubicaciones con estado correcto
  Dado que:  el folio "FOL-2026-00042" tiene 3 ubicaciones registradas (2 COMPLETE, 1 INCOMPLETE)
  Cuando:    el agente navega a /quotes/FOL-2026-00042/locations
  Entonces:  la cabecera muestra "3 de 3 ubicaciones registradas · 2 completas · 1 con alertas"
             y la tabla tiene 3 filas con el estado de cada una
             y el banner de alertas es visible con el conteo de ubicaciones con problemas
```

**Edge Case**
```gherkin
CRITERIO-1.2: Tabla vacía cuando no hay ubicaciones registradas
  Dado que:  el folio tiene layout configurado con 3 ubicaciones pero ninguna registrada
  Cuando:    el agente navega a /quotes/FOL-2026-00042/locations
  Entonces:  la tabla muestra el bloque vacío "+ Añadir 3 ubicaciones restantes"
             y el contador de cabecera muestra "0 de 3 ubicaciones registradas"
```

---

#### HU-02: Crear y editar ubicación — Datos básicos y CP

```
Como:        Agente de cotización
Quiero:      Ingresar el código postal de una ubicación y ver el auto-relleno de municipio, estado y colonias
Para:        Agilizar la captura y garantizar que el CP existe en el catálogo oficial

Prioridad:   Alta
Estimación:  L
Dependencias: HU-01, servicio core GET /v1/zip-codes/{zipCode}
Capa:        Frontend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Auto-relleno exitoso al ingresar CP válido
  Dado que:  el drawer de la ubicación 1 está abierto en la pestaña "Datos básicos"
  Cuando:    el agente escribe "06600" en el campo Código Postal
  Entonces:  los campos Estado y Municipio se rellenan automáticamente (readonly) con "Ciudad de México" y "Cuauhtémoc"
             y el select de Colonia presenta las opciones ["Juárez", "Tabacalera"]
             y el badge de zona catastrófica muestra "TEV-1 · FHM-2 · ZONE_A"
             y la alerta MISSING_ZIP_CODE desaparece de la lista de alertas bloqueantes
```

**Error Path**
```gherkin
CRITERIO-2.2: CP no encontrado en catálogo
  Dado que:  el drawer de la ubicación 1 está abierto en la pestaña "Datos básicos"
  Cuando:    el agente escribe "99999" en el campo Código Postal (inexistente)
  Entonces:  se muestra el mensaje "Código postal no encontrado en el catálogo"
             y los campos Estado, Municipio y Colonia quedan vacíos
             y la alerta MISSING_ZIP_CODE permanece activa
             y el badge de zona catastrófica no se muestra
```

**Edge Case**
```gherkin
CRITERIO-2.3: CP de 4 dígitos no dispara búsqueda
  Dado que:  el drawer de la ubicación 1 está abierto en la pestaña "Datos básicos"
  Cuando:    el agente escribe "0660" (4 dígitos) en el campo Código Postal
  Entonces:  no se realiza ninguna llamada a GET /v1/zip-codes/{zipCode}
             y no se muestra ningún mensaje de error
```

---

#### HU-03: Editar giro de negocio y ver clave incendio

```
Como:        Agente de cotización
Quiero:      Seleccionar el giro de negocio de la ubicación y ver la clave incendio asociada
Para:        Asegurar que el giro está correctamente clasificado para el cálculo de prima

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01, catálogo GET /v1/business-lines
Capa:        Frontend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: Selección de giro muestra card de confirmación con clave incendio
  Dado que:  el drawer está abierto en la pestaña "Giro"
  Cuando:    el agente selecciona "BL-001 — Bodega de mercancías" en el select de giro
  Entonces:  aparece una card con el código "BL-001", descripción "Bodega de mercancías" y clave incendio "FK-INC-01"
             y la alerta MISSING_FIRE_KEY desaparece
```

**Error Path**
```gherkin
CRITERIO-3.2: Sin giro seleccionado, alerta MISSING_FIRE_KEY activa
  Dado que:  el drawer está abierto y el campo giro está vacío
  Cuando:    el agente intenta guardar la ubicación
  Entonces:  la alerta MISSING_FIRE_KEY aparece en el footer del drawer
             y el botón "Guardar ubicación" permanece habilitado (no bloquea)
             y la ubicación se guarda en estado INCOMPLETE
```

---

#### HU-04: Configurar garantías de la ubicación

```
Como:        Agente de cotización
Quiero:      Activar y definir el valor asegurado de cada garantía de la ubicación
Para:        Determinar qué riesgos cubre la póliza y por qué valor

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: Activar garantía y establecer suma asegurada
  Dado que:  el drawer está abierto en la pestaña "Garantías"
  Cuando:    el agente activa el checkbox de "Incendio edificios (GUA-FIRE)" e ingresa 5,000,000
  Entonces:  el input de suma asegurada queda habilitado con el valor 5,000,000
             y la suma total del footer se actualiza
             y la alerta NO_TARIFABLE desaparece
```

**Error Path**
```gherkin
CRITERIO-4.2: Ninguna garantía activa genera alerta NO_TARIFABLE
  Dado que:  el drawer está abierto en la pestaña "Garantías" y todas las garantías están desactivadas
  Cuando:    el agente abre el footer del drawer
  Entonces:  la alerta NO_TARIFABLE está activa
             y la suma total es $0
```

**Edge Case**
```gherkin
CRITERIO-4.3: Desactivar checkbox limpia suma asegurada
  Dado que:  GUA-FIRE está activa con suma 5,000,000
  Cuando:    el agente desactiva el checkbox de GUA-FIRE
  Entonces:  el input de suma asegurada se deshabilita y su valor se resetea a 0
             y la suma total se recalcula
```

---

#### HU-05: Guardar ubicación con control de versión optimista

```
Como:        Agente de cotización
Quiero:      Guardar los cambios de una ubicación y que la versión del folio se incremente
Para:        Garantizar la consistencia de los datos y evitar conflictos de concurrencia

Prioridad:   Alta
Estimación:  S
Dependencias: HU-02, HU-03, HU-04
Capa:        Frontend
```

#### Criterios de Aceptación — HU-05

**Happy Path**
```gherkin
CRITERIO-5.1: Guardar ubicación COMPLETE incrementa versión
  Dado que:  la ubicación 1 tiene CP, giro y al menos una garantía válida
  Cuando:    el agente hace clic en "Guardar ubicación"
  Entonces:  se envía PATCH /v1/quotes/{folio}/locations/1 con los campos modificados y la version actual
             y la respuesta retorna version N+1
             y el badge del drawer cambia a COMPLETE
             y el drawer se cierra
             y la tabla se actualiza con el nuevo estado
```

**Error Path**
```gherkin
CRITERIO-5.2: Conflicto de versión al guardar
  Dado que:  otro proceso actualizó el folio mientras el agente editaba la ubicación
  Cuando:    el agente hace clic en "Guardar ubicación"
  Entonces:  el backend retorna HTTP 409 VERSION_CONFLICT
             y se muestra el mensaje "El folio fue modificado por otro proceso. Recargando datos..."
             y el drawer recarga la ubicación con la versión más reciente
```

**Happy Path — INCOMPLETE**
```gherkin
CRITERIO-5.3: Guardar ubicación INCOMPLETE no bloquea
  Dado que:  la ubicación 2 no tiene CP (MISSING_ZIP_CODE activo)
  Cuando:    el agente hace clic en "Guardar ubicación"
  Entonces:  la ubicación se guarda con validationStatus INCOMPLETE
             y el badge del drawer permanece INCOMPLETE con el conteo de alertas
             y las demás ubicaciones no son afectadas
```

---

#### HU-06: Selección múltiple en tabla

```
Como:        Agente de cotización
Quiero:      Seleccionar múltiples ubicaciones en la tabla
Para:        Realizar acciones en lote (futuro: eliminar, duplicar)

Prioridad:   Media
Estimación:  XS
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-06

**Happy Path**
```gherkin
CRITERIO-6.1: Checkbox de header selecciona todas las filas
  Dado que:  la tabla tiene 3 ubicaciones
  Cuando:    el agente hace clic en el checkbox del header
  Entonces:  las 3 filas quedan con data-state="selected" y estilo visual resaltado
             y el checkbox del header muestra estado "indeterminado" si hay selección parcial
```

---

### Reglas de Negocio

1. **CP obligatorio de 5 dígitos**: la búsqueda en catálogo solo se dispara cuando el campo tiene exactamente 5 dígitos numéricos.
2. **CP debe existir en catálogo**: si el core retorna 404, el CP se marca con alerta `MISSING_ZIP_CODE` y la ubicación queda `INCOMPLETE`.
3. **Giro obligatorio para tarificación**: si no hay `businessLine.fireKey`, la alerta `MISSING_FIRE_KEY` se activa; la ubicación puede guardarse como `INCOMPLETE`.
4. **Al menos una garantía tarifable**: si ningún guarantee tiene `insuredValue > 0`, la alerta `NO_TARIFABLE` se activa.
5. **Las ubicaciones INCOMPLETE no bloquean el guardado**: se persisten con `validationStatus: INCOMPLETE`.
6. **Versión optimista**: toda llamada PATCH incluye la `version` actual; conflicto → HTTP 409 → reload de datos.
7. **Suma asegurada mínima**: un guarantee desactivado debe tener `insuredValue: 0` en el payload (no nulo).
8. **Número de niveles**: entre 1 y 50 (validación de formulario).
9. **Año de construcción**: entre 1900 y 2026 (validación de formulario).
10. **Tipo constructivo**: exactamente uno de `MASONRY | STEEL | CONCRETE | WOOD | MIXED`.

---

## 2. DISEÑO

### Modelos de Datos

#### Interfaces TypeScript nuevas

| Interface | Archivo | Descripción |
|-----------|---------|-------------|
| `Location` | `cotizador/models/location.model.ts` | Modelo completo de una ubicación |
| `LocationSummary` | `cotizador/models/location.model.ts` | Versión ligera para el banner |
| `LocationsResponse` | `cotizador/models/location.model.ts` | Respuesta de GET/PUT /locations |
| `LocationResponse` | `cotizador/models/location.model.ts` | Respuesta de PATCH /locations/{index} |
| `LocationsSummary` | `cotizador/models/location.model.ts` | Respuesta de GET /locations/summary |
| `Guarantee` | `cotizador/models/location.model.ts` | Garantía con código y suma asegurada |
| `BusinessLine` | `cotizador/models/catalog.model.ts` | Giro de negocio del catálogo |
| `ZipCodeInfo` | `cotizador/models/zip-code.model.ts` | Información del CP del catálogo core |
| `BlockingAlert` | `cotizador/models/location.model.ts` | Alerta bloqueante con código y mensaje |

#### Campos del modelo `Location`

| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `index` | `number` | sí | ≥ 1 | Índice 1-based de la ubicación |
| `locationName` | `string` | sí | max 200 chars | Nombre descriptivo |
| `address` | `string` | sí | max 500 chars | Dirección completa |
| `zipCode` | `string` | sí | exactamente 5 dígitos | CP del catálogo |
| `state` | `string` | no | auto-fill desde catálogo | Estado (readonly) |
| `municipality` | `string` | no | auto-fill desde catálogo | Municipio (readonly) |
| `city` | `string` | no | auto-fill desde catálogo | Ciudad (readonly) |
| `neighborhood` | `string` | no | opciones del catálogo | Colonia seleccionada |
| `catastrophicZone` | `string` | no | auto-fill | Zona catastrófica |
| `tevZone` | `string` | no | auto-fill | Zona TEV |
| `fhmZone` | `string` | no | auto-fill | Zona FHM |
| `constructionType` | `ConstructionType` | sí | enum | Tipo constructivo |
| `level` | `number` | sí | 1–50 | Número de niveles |
| `constructionYear` | `number` | sí | 1900–2026 | Año de construcción |
| `businessLine` | `BusinessLine \| null` | no | catálogo | Giro seleccionado |
| `guarantees` | `Guarantee[]` | sí | al menos 1 con value > 0 para COMPLETE | Lista de garantías |
| `validationStatus` | `'COMPLETE' \| 'INCOMPLETE'` | sí | calculado por backend | Estado de la ubicación |
| `blockingAlerts` | `BlockingAlert[]` | sí | — | Alertas bloqueantes activas |

#### Enum `ConstructionType`

```typescript
export type ConstructionType = 'MASONRY' | 'STEEL' | 'CONCRETE' | 'WOOD' | 'MIXED';
```

#### Garantías fijas (no provienen de catálogo dinámico)

| Código | Descripción UI |
|--------|----------------|
| `GUA-FIRE` | Incendio edificios |
| `GUA-CONT` | Incendio contenidos |
| `GUA-THEFT` | Robo con violencia |
| `GUA-GLASS` | Vidrios |
| `GUA-ELEC` | Equipo electrónico |
| `GUA-CASH` | Dinero y valores |

---

### API Endpoints consumidos

#### GET /v1/quotes/{folio}/locations
- **Descripción**: Lista todas las ubicaciones con detalle completo
- **Auth requerida**: no (sesión implícita por folio)
- **Response 200**:
  ```json
  {
    "folioNumber": "FOL-2026-00042",
    "locations": [
      {
        "index": 1,
        "locationName": "Bodega Principal",
        "address": "Av. Insurgentes 1000",
        "zipCode": "06600",
        "state": "Ciudad de México",
        "municipality": "Cuauhtémoc",
        "neighborhood": "Juárez",
        "city": "Ciudad de México",
        "constructionType": "MASONRY",
        "level": 2,
        "constructionYear": 1995,
        "businessLine": { "code": "BL-001", "fireKey": "FK-INC-01", "description": "Bodega de mercancías" },
        "guarantees": [
          { "code": "GUA-FIRE", "insuredValue": 5000000 },
          { "code": "GUA-THEFT", "insuredValue": 500000 }
        ],
        "catastrophicZone": "ZONE_A",
        "validationStatus": "COMPLETE",
        "blockingAlerts": []
      }
    ],
    "version": 4
  }
  ```
- **Response 404**: `{ "error": "Folio not found", "code": "FOLIO_NOT_FOUND" }`

#### GET /v1/quotes/{folio}/locations/summary
- **Descripción**: Resumen ligero de validación — usado por `LocationsAlertBannerComponent`
- **Response 200**:
  ```json
  {
    "folioNumber": "FOL-2026-00042",
    "totalLocations": 3,
    "completeLocations": 2,
    "incompleteLocations": 1,
    "locations": [
      {
        "index": 2,
        "locationName": "Oficina Sur",
        "validationStatus": "INCOMPLETE",
        "blockingAlerts": [
          { "code": "MISSING_ZIP_CODE", "message": "Código postal requerido" },
          { "code": "MISSING_FIRE_KEY", "message": "Clave incendio requerida" }
        ]
      }
    ]
  }
  ```

#### PUT /v1/quotes/{folio}/locations
- **Descripción**: Reemplaza lista completa de ubicaciones
- **Request Body**:
  ```json
  {
    "locations": [{ "index": 1, "locationName": "...", "zipCode": "06600", "constructionType": "MASONRY", "level": 2, "constructionYear": 1995, "businessLine": { "code": "BL-001", "fireKey": "FK-INC-01" }, "guarantees": [{ "code": "GUA-FIRE", "insuredValue": 5000000 }] }],
    "version": 4
  }
  ```
- **Response 200**: lista completa actualizada + `version: 5`
- **Response 409**: `{ "error": "Optimistic lock conflict", "code": "VERSION_CONFLICT" }`

#### PATCH /v1/quotes/{folio}/locations/{index}
- **Descripción**: Actualización parcial de una ubicación (solo campos modificados)
- **Request Body**: solo los campos que cambiaron + `version`
- **Response 200**: ubicación actualizada + nueva `version`
- **Response 404**: `{ "error": "Location index not found", "code": "LOCATION_NOT_FOUND" }`
- **Response 409**: `{ "error": "Optimistic lock conflict", "code": "VERSION_CONFLICT" }`

#### GET /v1/zip-codes/{zipCode}
- **Descripción**: Lookup de CP en servicio core
- **Response 200**:
  ```json
  {
    "zipCode": "06600",
    "state": "Ciudad de México",
    "municipality": "Cuauhtémoc",
    "city": "Ciudad de México",
    "neighborhoods": ["Juárez", "Tabacalera"],
    "catastrophicZone": "ZONE_A",
    "tevZone": "TEV-1",
    "fhmZone": "FHM-2",
    "valid": true
  }
  ```
- **Response 404**: `{ "error": "Zip code not found", "code": "ZIP_CODE_NOT_FOUND" }`

#### GET /v1/business-lines
- **Descripción**: Catálogo de giros de negocio
- **Response 200**:
  ```json
  {
    "businessLines": [
      { "code": "BL-001", "description": "Bodega de mercancías", "fireKey": "FK-INC-01" }
    ]
  }
  ```

---

### Diseño Frontend

#### Componentes nuevos

| Componente | Tipo Atomic | Archivo | Descripción |
|------------|-------------|---------|-------------|
| `LocationsPageComponent` | Page | `cotizador/pages/locations/locations-page.component.ts` | Página principal con cabecera, tabla y drawer |
| `LocationsAlertBannerComponent` | Molecule | `cotizador/components/locations-alert-banner/locations-alert-banner.component.ts` | Banner warn con alertas bloqueantes |
| `LocationsTableComponent` | Organism | `cotizador/components/locations-table/locations-table.component.ts` | Tabla de ubicaciones con selección múltiple |
| `LocationDrawerComponent` | Organism | `cotizador/components/location-drawer/location-drawer.component.ts` | Panel lateral con 4 pestañas de edición |
| `LocationBasicDataTabComponent` | Molecule | `cotizador/components/location-drawer/tabs/basic-data-tab.component.ts` | Pestaña: datos básicos + CP lookup |
| `LocationConstructionTabComponent` | Molecule | `cotizador/components/location-drawer/tabs/construction-tab.component.ts` | Pestaña: tipo constructivo, niveles, año |
| `LocationBusinessLineTabComponent` | Molecule | `cotizador/components/location-drawer/tabs/business-line-tab.component.ts` | Pestaña: select de giro + card de confirmación |
| `LocationGuaranteesTabComponent` | Molecule | `cotizador/components/location-drawer/tabs/guarantees-tab.component.ts` | Pestaña: lista de 6 garantías con checkbox + input |

#### Páginas

| Página | Ruta | Archivo de rutas |
|--------|------|-----------------|
| `LocationsPageComponent` | `/quotes/:folio/locations` | `cotizador.routes.ts` |

#### Servicios nuevos (TDD obligatorio)

| Servicio | Archivo | Método Angular | Descripción |
|----------|---------|----------------|-------------|
| `LocationService` | `cotizador/services/location.service.ts` | `HttpClient` | CRUD de ubicaciones del folio |
| `ZipCodeService` | `cotizador/services/zip-code.service.ts` | `HttpClient` | Lookup de CP en servicio core |
| `CatalogService` | `cotizador/services/catalog.service.ts` | `HttpClient` | Catálogos: giros de negocio |

#### Métodos de `LocationService`

| Método | Endpoint | Retorno |
|--------|----------|---------|
| `listar(folio: string)` | `GET /v1/quotes/{folio}/locations` | `Observable<LocationsResponse>` |
| `obtenerResumen(folio: string)` | `GET /v1/quotes/{folio}/locations/summary` | `Observable<LocationsSummary>` |
| `reemplazarLista(folio, locations, version)` | `PUT /v1/quotes/{folio}/locations` | `Observable<LocationsResponse>` |
| `actualizarParcial(folio, index, fields, version)` | `PATCH /v1/quotes/{folio}/locations/{index}` | `Observable<LocationResponse>` |

#### Métodos de `ZipCodeService`

| Método | Endpoint | Retorno | Error |
|--------|----------|---------|-------|
| `buscar(zipCode: string)` | `GET /v1/zip-codes/{zipCode}` | `Observable<ZipCodeInfo>` | 404 → `ZIP_CODE_NOT_FOUND` |

#### Métodos de `CatalogService`

| Método | Endpoint | Retorno |
|--------|----------|---------|
| `obtenerGiros()` | `GET /v1/business-lines` | `Observable<BusinessLine[]>` |

#### Comportamiento del CP lookup

- El campo CP usa `debounceTime(400)` + `distinctUntilChanged()` + `filter(v => v.length === 5)`
- Si el lookup retorna 404, se muestra mensaje inline en el campo CP
- Los campos Estado, Municipio, Ciudad son siempre `readonly` (solo se populan desde el catálogo)
- El select de Colonia carga las opciones del array `neighborhoods` de la respuesta

#### Comportamiento del drawer

- Al abrir, el formulario se inicializa con los valores actuales de la ubicación
- Cambios en cualquier pestaña actualizan el estado de alertas en tiempo real (el footer refleja los cambios sin llamada HTTP)
- "Guardar ubicación" llama a `actualizarParcial` con solo los campos que cambiaron (diff respecto al estado inicial)
- "Cancelar" descarta cambios locales sin llamada HTTP

#### Estado de selección en tabla

- La tabla mantiene un `Set<number>` con los índices seleccionados
- El checkbox del header tiene 3 estados: unchecked (ninguno), indeterminate (algunos), checked (todos)
- Fila clickeable en cualquier celda (salvo en el propio checkbox) → abre el drawer

---

### Arquitectura y Dependencias

- Paquetes nuevos: ninguno — se reutilizan `ReactiveFormsModule`, `HttpClient`, `RxJS` del stack aprobado
- El `ZipCodeService` apunta al servicio core (puerto 8081): la URL base es distinta a la del quoter (puerto 8080). Usar `environment.coreApiUrl` (agregar si no existe)
- `CatalogService` puede coexistir con futuros catálogos; si ya existe un `CatalogService` en `core/services/`, añadir el método `obtenerGiros()` ahí en lugar de crear uno nuevo
- Registrar la ruta `/quotes/:folio/locations` en `cotizador.routes.ts` de forma lazy si el módulo usa lazy loading

### Notas de Implementación

> - El `LocationDrawerComponent` gestiona su propio `FormGroup` con sub-grupos por pestaña; NO reutiliza el form de la página.
> - `environment.coreApiUrl` debe apuntar a `http://localhost:8081` (core OHS). Verificar si ya existe en `environment.ts` antes de añadirlo.
> - El `CatalogService` debe cachear la respuesta de `obtenerGiros()` con `shareReplay(1)` para evitar múltiples llamadas al abrir distintos drawers.
> - El badge de zona catastrófica no es editable: se calcula a partir del CP y se muestra como solo lectura con los 3 valores (TEV, FHM, ZONE).
> - El botón "Exportar CSV" y "Duplicar" son visuales en esta iteración (sin funcionalidad).

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Frontend

#### Modelos

- [x] Crear `src/app/features/cotizador/models/location.model.ts` — interfaces `Location`, `LocationSummary`, `LocationsResponse`, `LocationResponse`, `LocationsSummary`, `Guarantee`, `BlockingAlert`, enum `ConstructionType`
- [x] Crear `src/app/features/cotizador/models/zip-code.model.ts` — interface `ZipCodeInfo`
- [x] Crear o actualizar `src/app/features/cotizador/models/catalog.model.ts` — interface `BusinessLine`

#### Services (TDD: test antes de implementación)

- [x] Escribir tests de `LocationService` (`location.service.spec.ts`) — RED
- [x] Implementar `LocationService` (`location.service.ts`) — GREEN
- [x] Escribir tests de `ZipCodeService` (`zip-code.service.spec.ts`) — RED
- [x] Implementar `ZipCodeService` (`zip-code.service.ts`) — GREEN
- [x] Escribir tests de `CatalogService.obtenerGiros()` (`catalog.service.spec.ts`) — RED
- [x] Implementar `CatalogService.obtenerGiros()` (`catalog.service.ts`) — GREEN

#### Componentes

- [x] Implementar `LocationsAlertBannerComponent` — recibe `@Input() summary: LocationsSummary`
- [x] Implementar `LocationsTableComponent` — tabla con selección múltiple, columnas especificadas, footer con suma total
- [x] Implementar `LocationBasicDataTabComponent` — formulario CP con lookup RxJS + auto-fill + badge zona
- [x] Implementar `LocationConstructionTabComponent` — radio cards tipo constructivo + inputs nivel y año
- [x] Implementar `LocationBusinessLineTabComponent` — select giro + card de confirmación con clave incendio
- [x] Implementar `LocationGuaranteesTabComponent` — lista fija 6 garantías con checkbox + input MXN + suma total
- [x] Implementar `LocationDrawerComponent` — panel lateral con 4 pestañas, footer con alertas + versión + botones
- [x] Implementar `LocationsPageComponent` — cabecera con contador, integra tabla + drawer + banner

#### Rutas y Entorno

- [x] Registrar ruta `/quotes/:folio/locations` → `LocationsPageComponent` en `cotizador.routes.ts`
- [x] Verificar/agregar `coreApiUrl` en `environment.ts` y `environment.prod.ts` (puerto 8081)

### Tests Frontend (cobertura ≥ 80%)

#### LocationService
- [x] `listar() retorna Observable<LocationsResponse> con GET correcto`
- [x] `obtenerResumen() retorna Observable<LocationsSummary> con GET correcto`
- [x] `reemplazarLista() llama PUT con body correcto incluyendo version`
- [x] `actualizarParcial() llama PATCH al índice correcto con fields y version`
- [x] `actualizarParcial() propaga error 409 VERSION_CONFLICT`
- [x] `actualizarParcial() propaga error 404 LOCATION_NOT_FOUND`

#### ZipCodeService
- [x] `buscar() retorna ZipCodeInfo para CP válido`
- [x] `buscar() lanza error ZIP_CODE_NOT_FOUND para CP inexistente (404)`
- [x] `buscar() propaga errores de red`

#### CatalogService
- [x] `obtenerGiros() retorna array de BusinessLine`
- [x] `obtenerGiros() usa shareReplay(1) — segunda suscripción no genera nueva llamada HTTP`

### QA

- [x] Ejecutar skill `/gherkin-case-generator` sobre los criterios CRITERIO-1.1 a CRITERIO-6.1
- [x] Ejecutar skill `/risk-identifier` — clasificación ASD de riesgos del feature
- [x] Ejecutar skill `/performance-analyzer` si el catálogo de CP tiene > 10,000 registros (riesgo de latencia)
- [x] Validar cobertura de tests con `ng test --code-coverage` — umbral mínimo 80% en `LocationService` y `ZipCodeService`
- [x] Verificar que `VERSION_CONFLICT` muestra mensaje al usuario y recarga datos
- [x] Verificar que ubicaciones INCOMPLETE coexisten con COMPLETE en la tabla sin errores
- [x] Actualizar estado spec a `status: IMPLEMENTED` al finalizar
