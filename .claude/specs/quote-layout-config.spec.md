---
id: SPEC-006
status: IN_PROGRESS
feature: quote-layout-config
created: 2026-04-22
updated: 2026-04-22
author: spec-generator
version: "1.0"
related-specs:
  - quote-general-info.spec.md
---

# Spec: Configuración de Layout de Ubicaciones (Paso 2 de 5)

> **Estado:** `DRAFT` → aprobar con `status: IMPLEMENTED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Segundo paso del wizard de cotización. El agente define cuántas ubicaciones tendrá el folio y el tipo de distribución de esas ubicaciones (`SINGLE`, `MULTIPLE` o `DISTRIBUTED`). Esta configuración actúa como plantilla que se replica al registrar cada ubicación individual en el paso siguiente.

### Requerimiento de Negocio
El usuario selecciona el número de ubicaciones (1–50) y el tipo de distribución mediante radio cards visuales. Al guardar, el stepper marca el paso "Layout" como `COMPLETE` y habilita la navegación al paso 3 (Ubicaciones).

### Nota de routing importante
El stepper actual define el paso 2 con `route: 'layout'`, lo que resuelve a `/quotes/:folioNumber/layout`. El requerimiento menciona que el layout es conceptualmente un sub-paso de `/quotes/:folio/locations`. **La spec respeta la ruta existente** (`/layout`) para no romper el stepper y las rutas ya configuradas. Si se desea consolidar ambas rutas en el futuro, se requiere una spec de refactor de routing.

### Historias de Usuario

#### HU-01: Cargar configuración de layout existente

```
Como:        Agente autenticado que navega al paso 2 del wizard
Quiero:      Ver la configuración de layout previamente guardada (si existe)
Para:        No perder datos ya ingresados al navegar entre pasos

Prioridad:   Alta
Estimación:  S
Dependencias: quote-general-info.spec.md (el folio debe existir)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Cargar layout guardado previamente
  Dado que:  El folio "FOL-2026-00042" tiene una configuración de layout guardada
             con numberOfLocations=3 y locationType="MULTIPLE"
  Cuando:    El agente navega a /quotes/FOL-2026-00042/layout
  Entonces:  El formulario muestra 3 en el input de número de ubicaciones
             Y el radio card "Múltiples ubicaciones" aparece seleccionado (borde primario + ícono check)
```

**Edge Case**
```gherkin
CRITERIO-1.2: Folio sin layout configurado (primera vez en el paso)
  Dado que:  El folio "FOL-2026-00042" no tiene layoutConfiguration guardada (GET retorna 200 con campos nulos)
  Cuando:    El agente navega a /quotes/FOL-2026-00042/layout
  Entonces:  El input de número de ubicaciones aparece vacío (sin valor por defecto)
             Y ningún radio card está seleccionado
```

**Error Path**
```gherkin
CRITERIO-1.3: Error de red al cargar
  Dado que:  El backend no responde (timeout o 5xx)
  Cuando:    El agente navega a /quotes/FOL-2026-00042/layout
  Entonces:  Se muestra un mensaje de error no bloqueante
             Y el formulario permanece vacío pero usable
```

---

#### HU-02: Guardar configuración de layout

```
Como:        Agente autenticado en el paso 2 del wizard
Quiero:      Guardar el número de ubicaciones y el tipo de distribución seleccionado
Para:        Que el sistema use esta configuración como plantilla en el paso de ubicaciones

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Guardar layout válido
  Dado que:  El agente ha ingresado numberOfLocations=5 y seleccionado locationType="DISTRIBUTED"
  Cuando:    El agente hace clic en "Guardar y continuar"
  Entonces:  Se emite PUT /v1/quotes/{folio}/locations/layout con el body correcto y la versión actual
             Y el stepper marca el paso "Layout" como COMPLETE
             Y el agente es redirigido al paso 3 (Ubicaciones)
```

**Error Path**
```gherkin
CRITERIO-2.2: Conflicto de versión optimista (409)
  Dado que:  El folio fue modificado desde otra sesión (versión desincronizada)
  Cuando:    El agente intenta guardar
  Entonces:  Se muestra el mensaje "El folio fue modificado desde otra sesión. Recarga la página para continuar."
             Y el formulario NO navega al siguiente paso
```

**Validaciones de formulario**
```gherkin
CRITERIO-2.3: Input numérico fuera de rango
  Dado que:  El agente ingresa un valor menor que 1 o mayor que 50
  Cuando:    El agente intenta guardar
  Entonces:  El campo muestra error inline "El número de ubicaciones debe estar entre 1 y 50"
             Y el botón de guardar permanece deshabilitado o no ejecuta la llamada HTTP

CRITERIO-2.4: Tipo de ubicación no seleccionado
  Dado que:  El agente no ha seleccionado ningún radio card
  Cuando:    El agente intenta guardar
  Entonces:  Se muestra el error "Selecciona un tipo de ubicación"
             Y no se realiza la llamada HTTP
```

### Reglas de Negocio

1. **Rango obligatorio:** `numberOfLocations` debe ser un entero entre 1 y 50 (ambos inclusive). No se aceptan decimales.
2. **Tipo obligatorio:** `locationType` es obligatorio. Los únicos valores válidos son `SINGLE`, `MULTIPLE`, `DISTRIBUTED`.
3. **Control de concurrencia:** Toda llamada PUT incluye el campo `version` del recurso cargado. Un 409 indica conflicto de versión; el frontend debe informar al usuario sin sobrescribir datos.
4. **Plantilla replicable:** El texto informativo "Este layout se replicará como plantilla al registrar ubicaciones. Podrás sobrescribirlo ubicación por ubicación." debe ser siempre visible en el formulario.
5. **Navegación del stepper:** El paso "Layout" pasa a estado `COMPLETE` únicamente después de un guardado exitoso (respuesta 200 del PUT).

---

## 2. DISEÑO

### Modelos de Datos

#### Modelos TypeScript nuevos
Archivo: `src/app/features/cotizador/models/layout-config.model.ts`

| Tipo | Nombre | Descripción |
|------|--------|-------------|
| `type` | `LocationType` | `'SINGLE' \| 'MULTIPLE' \| 'DISTRIBUTED'` |
| `interface` | `LayoutConfiguration` | `{ numberOfLocations: number; locationType: LocationType }` |
| `interface` | `LayoutConfigResponse` | `{ folioNumber: string; layoutConfiguration: LayoutConfiguration; version: number; updatedAt?: string }` |
| `interface` | `SaveLayoutConfigRequest` | `{ layoutConfiguration: LayoutConfiguration; version: number }` |

### API Endpoints

#### GET /v1/quotes/{folio}/locations/layout
- **Descripción:** Obtiene la configuración de layout guardada para el folio
- **Path param:** `folio` — número de folio (ej. `FOL-2026-00042`)
- **Response 200:**
  ```json
  {
    "folioNumber": "FOL-2026-00042",
    "layoutConfiguration": {
      "numberOfLocations": 3,
      "locationType": "MULTIPLE"
    },
    "version": 3
  }
  ```
- **Response 404:** `{ "error": "Folio not found", "code": "FOLIO_NOT_FOUND" }`

#### PUT /v1/quotes/{folio}/locations/layout
- **Descripción:** Guarda o actualiza la configuración de layout con control de versión optimista
- **Request body:**
  ```json
  {
    "layoutConfiguration": {
      "numberOfLocations": 3,
      "locationType": "MULTIPLE"
    },
    "version": 3
  }
  ```
- **Response 200:**
  ```json
  {
    "folioNumber": "FOL-2026-00042",
    "layoutConfiguration": {
      "numberOfLocations": 3,
      "locationType": "MULTIPLE"
    },
    "updatedAt": "2026-04-20T15:20:00Z",
    "version": 4
  }
  ```
- **Response 409:** `{ "error": "Optimistic lock conflict", "code": "VERSION_CONFLICT" }`
- **Response 422:** `{ "error": "Validation failed", "code": "VALIDATION_ERROR", "fields": [...] }`

### Diseño Frontend

#### Componentes nuevos

| Nivel | Componente | Carpeta | Descripción |
|-------|-----------|---------|-------------|
| Organism | `LayoutConfigFormComponent` | `features/cotizador/components/layout-config-form/` | Formulario reactivo con input numérico + radio cards de tipo de ubicación |

#### Componentes reutilizados (sin modificar)

| Nivel | Componente | Uso en este feature |
|-------|-----------|---------------------|
| Page | `LayoutPage` | Ya existe como stub — se implementa en este feature |
| Atom | `SectionHeaderComponent` | Cabecera "Folio FOL-XXXX · Paso 2 de 5" + título |
| Atom | `InputComponent` | Input numérico de numberOfLocations |
| Atom | `BtnComponent` | Botón "Guardar y continuar" |
| Organism | `StepperComponent` | Barra de progreso; se actualiza el estado del paso "Layout" |

#### Páginas modificadas

| Página | Archivo | Cambio |
|--------|---------|--------|
| `LayoutPage` | `pages/layout.page.ts` | Implementar desde el stub vacío: cargar datos via `LayoutConfigService`, componer `LayoutConfigFormComponent`, manejar guardado y navegación |

#### Routing

No se crean rutas nuevas. La ruta `/layout` ya está registrada en `cotizador.routes.ts`:
```typescript
{ path: 'layout', component: LayoutPage }
```

#### Service (TDD obligatorio)

Archivo: `src/app/features/cotizador/services/layout-config.service.ts`
Spec de test: `src/app/features/cotizador/services/layout-config.service.spec.ts`

| Método | Firma | Endpoint | Descripción |
|--------|-------|---------|-------------|
| `load` | `load(folio: string): Observable<LayoutConfigResponse>` | `GET /v1/quotes/{folio}/locations/layout` | Carga la config actual del folio |
| `save` | `save(folio: string, layoutConfiguration: LayoutConfiguration, version: number): Observable<LayoutConfigResponse>` | `PUT /v1/quotes/{folio}/locations/layout` | Guarda la config con optimistic locking |

Patrón de implementación (seguir convención existente en `general-info.service.ts`):

```typescript
@Injectable({ providedIn: 'root' })
export class LayoutConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1`;

  load(folio: string): Observable<LayoutConfigResponse> {
    return this.http.get<LayoutConfigResponse>(
      `${this.baseUrl}/quotes/${folio}/locations/layout`
    );
  }

  save(
    folio: string,
    layoutConfiguration: LayoutConfiguration,
    version: number
  ): Observable<LayoutConfigResponse> {
    const body: SaveLayoutConfigRequest = { layoutConfiguration, version };
    return this.http.put<LayoutConfigResponse>(
      `${this.baseUrl}/quotes/${folio}/locations/layout`,
      body
    );
  }
}
```

#### Diseño visual — LayoutConfigFormComponent

```
┌──────────────────────────────────────────────────────┐
│  Folio FOL-XXXX · Paso 2 de 5                        │  ← SectionHeader (eyebrow)
│  Layout de ubicaciones                               │  ← SectionHeader (title)
│  Configura la cantidad y tipo de ubicaciones...      │  ← SectionHeader (subtitle)
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Grid 2 columnas                                │ │
│  │  ┌───────────────────┐ ┌─────────────────────┐ │ │
│  │  │ Número de         │ │ Tipo de ubicación * │ │ │
│  │  │ ubicaciones *     │ │                     │ │ │
│  │  │ [  3  ] (1-50)   │ │ ┌──────┐┌──────┐   │ │ │
│  │  │                  │ │ │SINGLE││MULTI ││DIST│ │ │
│  │  └───────────────────┘ └─────────────────────┘ │ │
│  │                                                 │ │
│  │  ─────────────────────────────────────────────  │ │
│  │  ℹ Este layout se replicará como plantilla...   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│                          [ Guardar y continuar →  ]  │
└──────────────────────────────────────────────────────┘
```

**Radio card seleccionado:**
- Borde: `1px solid var(--brand-500)` (color primario)
- Fondo: `color-mix(in oklch, var(--brand-500) 10%, transparent)` (tint primario)
- Ícono check-circle visible (color `var(--brand-700)`)

**Radio card no seleccionado:**
- Borde: `1px solid var(--border-strong)`
- Fondo: `var(--surface)`
- Sin ícono check

### Arquitectura y Dependencias

- **Sin dependencias externas nuevas** — solo `@angular/common/http`, `@angular/forms` (ReactiveFormsModule), `rxjs`
- **Impacto en stepper:** `LayoutPage` deberá emitir el evento de paso completo (o actualizar el estado en el servicio compartido del stepper). Revisar `StepperComponent` y `folio.model.ts` para el mecanismo de `stepStatus`.
- **Formulario reactivo:** `ReactiveFormsModule` con `FormGroup` y `Validators.required`, `Validators.min(1)`, `Validators.max(50)`.

### Notas de Implementación

- El `LayoutConfigFormComponent` recibe `@Input() folio: string` y `@Input() initialData?: LayoutConfigResponse`, emite `@Output() saved = new EventEmitter<LayoutConfigResponse>()`. La lógica HTTP vive en `LayoutConfigService`, no en el componente.
- El `LayoutPage` es responsable de llamar a `LayoutConfigService.load()` al inicializar (con `takeUntilDestroyed()`) y de llamar a `save()` al recibir el evento del formulario.
- El `locationType` como radio card se implementa con Angular Reactive Forms: un `FormControl<LocationType | null>` cuyo valor se actualiza al hacer clic en cada card. No usar `<input type="radio">` nativo sin conectar al `FormControl`.
- El error 409 se maneja en el `LayoutPage` con un `catchError` en el pipe del observable de `save()`.

---

## 3. LISTA DE TAREAS

> Checklist accionable. Marcar cada ítem (`[x]`) al completarlo.

### Frontend

#### Modelos
- [x] Crear `src/app/features/cotizador/models/layout-config.model.ts`
  - `LocationType`, `LayoutConfiguration`, `LayoutConfigResponse`, `SaveLayoutConfigRequest`

#### Service (TDD — test antes de implementación)
- [x] Crear `layout-config.service.spec.ts` con los siguientes tests (RED primero):
  - `[x]` `load() emite GET /v1/quotes/{folio}/locations/layout`
  - `[x]` `load() retorna Observable<LayoutConfigResponse> con datos del servidor`
  - `[x]` `save() emite PUT /v1/quotes/{folio}/locations/layout con body correcto`
  - `[x]` `save() incluye version en el body`
  - `[x]` `save() propaga error 409 VERSION_CONFLICT sin transformar`
- [x] Implementar `layout-config.service.ts` (GREEN — mínimo que pasa los tests)
- [x] Verificar cobertura ≥ 80% del service

#### Componente Organism
- [x] Crear `src/app/features/cotizador/components/layout-config-form/` con:
  - `layout-config-form.component.ts` — `ReactiveFormsModule`, `@Input()` folio + initialData, `@Output()` saved
  - `layout-config-form.component.html` — grid 2 col, input numérico, 3 radio cards, texto informativo, botón
  - `layout-config-form.component.scss` — estilos de radio card (seleccionado / no seleccionado)

#### Page
- [x] Implementar `LayoutPage` (`pages/layout.page.ts`) reemplazando el stub:
  - Leer `:folioNumber` de `ActivatedRoute`
  - Llamar `LayoutConfigService.load(folio)` en `ngOnInit` con `takeUntilDestroyed()`
  - Componer `SectionHeader` + `LayoutConfigFormComponent`
  - Manejar evento `(saved)`: actualizar estado del stepper a `COMPLETE` + navegar a `locations`
  - Manejar error 409: mostrar mensaje de error sin navegar
  - Crear `layout.page.html` y `layout.page.scss`

#### Stepper
- [x] Verificar que el estado del paso "Layout" (`key: 'layout'`) se actualiza a `COMPLETE` tras guardado exitoso
  - Revisar mecanismo en `folio.model.ts` → `StepDefinition.status` y cómo `StepperComponent` lo consume

### QA
- [x] Ejecutar `/gherkin-case-generator` → cubrir CRITERIO-1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4
- [x] Ejecutar `/risk-identifier` → clasificación ASD de riesgos del feature
- [x] Validar cobertura ≥ 80% en `LayoutConfigService` con `ng test --code-coverage`
- [ ] Verificar manualmente en navegador:
  - Radio card resalta al seleccionarse (borde primario + ícono check)
  - Input numérico rechaza valores fuera de 1–50
  - Stepper pasa a `COMPLETE` tras guardar con datos válidos
  - Error 409 muestra mensaje sin navegar
- [x] Actualizar estado spec: `status: IMPLEMENTED`
