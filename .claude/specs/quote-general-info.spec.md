---
id: SPEC-005
status: IMPLEMENTED
feature: quote-general-info
created: 2026-04-22
updated: 2026-04-22
author: spec-generator
version: "1.0"
related-specs: [SPEC-001, SPEC-002, SPEC-003, SPEC-004]
---

# Spec: Datos Generales de la Cotización (Paso 1 de 5)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Implementa el Paso 1 del wizard de cotización. Captura los datos del asegurado (razón social, RFC, correo y teléfono) y los datos de suscripción (suscriptor, agente, clasificación de riesgo y tipo de negocio). El formulario persiste los datos mediante PUT `/v1/quotes/{folio}/general-info` con control de concurrencia optimista (campo `version`).

### Requerimiento de Negocio

El cotizador requiere que, antes de continuar al Paso 2 (Layout de ubicaciones), el agente capture la información básica del asegurado y la asignación técnica de suscripción. El sistema debe validar el formato del RFC, filtrar agentes por suscriptor seleccionado, y manejar conflictos de versión cuando dos sesiones editan el mismo folio simultáneamente.

### Historias de Usuario

#### HU-01: Capturar datos del asegurado

```
Como:        Agente autenticado en el cotizador
Quiero:      Rellenar los datos del asegurado (razón social, RFC, correo, teléfono)
Para:        Identificar al titular del contrato antes de continuar al siguiente paso

Prioridad:   Alta
Estimación:  M
Dependencias: SPEC-004 (app-shell con MainLayoutComponent y rutas)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Guardar datos del asegurado válidos
  Dado que:  El agente está en /quotes/FOL-2026-00042/general-info con el folio cargado (version=2)
  Cuando:    Completa "Razón social", "RFC" (XAXX010101000), "Correo" y "Teléfono" y pulsa "Guardar"
  Entonces:  Se realiza PUT /v1/quotes/FOL-2026-00042/general-info con { insuredData, underwritingData, version: 2 }
             La respuesta 200 retorna version: 3
             El campo version en QuoteStateService se actualiza a 3
             El StatusBar refleja la versión actualizada
```

**Error Path**
```gherkin
CRITERIO-1.2: Campos obligatorios vacíos al intentar avanzar
  Dado que:  El agente está en el formulario con campos del asegurado vacíos
  Cuando:    Pulsa "Guardar" o intenta avanzar al Paso 2
  Entonces:  Cada campo vacío muestra el mensaje de error de validación
             No se realiza ninguna llamada HTTP
```

**Error Path**
```gherkin
CRITERIO-1.3: RFC con formato inválido
  Dado que:  El agente escribe "abc123" en el campo RFC
  Cuando:    El campo pierde el foco (blur)
  Entonces:  Se muestra el mensaje "RFC inválido — debe tener entre 12 y 13 caracteres alfanuméricos"
             No se realiza ninguna llamada HTTP
```

**Edge Case**
```gherkin
CRITERIO-1.4: RFC se fuerza a mayúsculas al tipear
  Dado que:  El agente está en el campo RFC
  Cuando:    Escribe "xaxx010101000"
  Entonces:  El campo muestra "XAXX010101000" (conversión en tiempo real vía directive o transformación en el control)
```

---

#### HU-02: Seleccionar datos de suscripción con filtrado dinámico de agentes

```
Como:        Agente autenticado en el cotizador
Quiero:      Seleccionar suscriptor, agente (filtrado por suscriptor), clasificación de riesgo y tipo de negocio
Para:        Asignar correctamente la responsabilidad técnica de la cotización

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01, CatalogService (ya implementado en SPEC-003)
Capa:        Frontend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Filtrar agentes al cambiar suscriptor
  Dado que:  El catálogo tiene agentes AGT-123 (SUB-001) y AGT-456 (SUB-002)
             Y el agente selecciona SUB-001 en el select de suscriptor
  Cuando:    Se actualiza el valor del select de suscriptor
  Entonces:  El select de agentes muestra solo AGT-123
             El valor previo del select de agentes se limpia si el agente seleccionado no pertenece al nuevo suscriptor
```

**Happy Path**
```gherkin
CRITERIO-2.2: Seleccionar clasificación de riesgo y tipo de negocio
  Dado que:  El agente tiene todos los selects de suscripción disponibles
  Cuando:    Selecciona STANDARD / COMMERCIAL
  Entonces:  Los valores quedan reflejados en el formulario reactivo
             El badge de completitud de la tarjeta Suscripción cambia a "Completo"
```

**Error Path**
```gherkin
CRITERIO-2.3: Suscriptor no seleccionado al intentar guardar
  Dado que:  El select de suscriptor está vacío
  Cuando:    El agente pulsa "Guardar"
  Entonces:  El select de suscriptor muestra mensaje de error "Campo obligatorio"
             No se realiza ninguna llamada HTTP
```

---

#### HU-03: Gestionar conflicto de versión optimista

```
Como:        Agente autenticado en el cotizador
Quiero:      Recibir una notificación clara cuando otro usuario modificó el folio simultáneamente
Para:        Evitar sobreescribir cambios de otra sesión sin saberlo

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-03

**Error Path**
```gherkin
CRITERIO-3.1: Conflicto de versión (409 VERSION_CONFLICT)
  Dado que:  El agente tiene el formulario con version=2
             Y otro usuario ya guardó el folio incrementando la versión a 3
  Cuando:    El agente pulsa "Guardar" (envía version=2)
  Entonces:  El backend responde 409 { "code": "VERSION_CONFLICT" }
             GeneralInfoService propaga el error al componente
             Se muestra un mensaje: "El folio fue modificado por otra sesión. Recarga para obtener la versión actual."
             El formulario no se limpia
```

---

### Reglas de Negocio

1. **RFC persona moral**: 12 caracteres — 3 letras + 6 dígitos (fecha) + 3 caracteres alfanuméricos.
2. **RFC persona física**: 13 caracteres — 4 letras + 6 dígitos (fecha) + 3 caracteres alfanuméricos.
3. El campo RFC se convierte a mayúsculas en tiempo real; no se permite entrada en minúsculas.
4. El select de Agente solo muestra agentes cuyo `subscriberId` coincida con el suscriptor actualmente seleccionado.
5. Si el suscriptor cambia y el agente previamente seleccionado no pertenece al nuevo suscriptor, el campo Agente se limpia.
6. La llamada PUT siempre incluye el campo `version` del folio activo en `QuoteStateService`.
7. Un error 409 con código `VERSION_CONFLICT` debe propagarse hasta el componente; el servicio no lo captura silenciosamente.
8. Un error 422 con código `VALIDATION_ERROR` muestra los errores de campo retornados por el backend.
9. Los catálogos de Suscriptores y Agentes se consumen desde `CatalogService` (ya implementado). No se duplica la lógica HTTP.
10. Las clasificaciones de riesgo (`STANDARD`, `PREFERRED`, `SUBSTANDARD`) y tipos de negocio (`COMMERCIAL`, `INDUSTRIAL`, `RESIDENTIAL`) son enumeraciones locales; no requieren endpoint adicional.

---

## 2. DISEÑO

### Modelos de Datos

#### Modelos nuevos (archivo: `features/cotizador/models/general-info.model.ts`)

| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `InsuredData.name` | `string` | sí | min 1 char | Razón social del asegurado |
| `InsuredData.rfc` | `string` | sí | 12–13 chars, mayúsculas, formato RFC | RFC persona moral o física |
| `InsuredData.email` | `string` | sí | formato email válido | Correo de contacto |
| `InsuredData.phone` | `string` | sí | solo dígitos, 10 chars | Teléfono |
| `UnderwritingData.subscriberId` | `string` | sí | valor en catálogo | ID del suscriptor |
| `UnderwritingData.agentCode` | `string` | sí | valor en catálogo filtrado | Código del agente |
| `UnderwritingData.riskClassification` | `RiskClassification` | sí | enum | Clasificación de riesgo |
| `UnderwritingData.businessType` | `BusinessType` | sí | enum | Tipo de negocio |
| `GeneralInfoRequest.version` | `number` | sí | integer ≥ 1 | Versión para optimistic lock |
| `GeneralInfoResponse.folioNumber` | `string` | sí | — | Folio de la cotización |
| `GeneralInfoResponse.quoteStatus` | `QuoteStatus` | sí | — | Estado de la cotización |
| `GeneralInfoResponse.updatedAt` | `string` | sí | ISO 8601 | Timestamp de actualización |
| `GeneralInfoResponse.version` | `number` | sí | — | Nueva versión tras guardado |

```typescript
// general-info.model.ts
export type RiskClassification = 'STANDARD' | 'PREFERRED' | 'SUBSTANDARD';
export type BusinessType = 'COMMERCIAL' | 'INDUSTRIAL' | 'RESIDENTIAL';

export interface InsuredData {
  name: string;
  rfc: string;
  email: string;
  phone: string;
}

export interface UnderwritingData {
  subscriberId: string;
  agentCode: string;
  riskClassification: RiskClassification;
  businessType: BusinessType;
}

export interface GeneralInfoRequest {
  insuredData: InsuredData;
  underwritingData: UnderwritingData;
  version: number;
}

export interface GeneralInfoResponse {
  folioNumber: string;
  quoteStatus: import('../../../core/models/folio.model').QuoteStatus;
  insuredData: InsuredData;
  underwritingData: UnderwritingData;
  updatedAt: string;
  version: number;
}
```

#### Modelos existentes reutilizados (sin modificar)
| Modelo | Archivo | Uso |
|--------|---------|-----|
| `Subscriber` | `core/models/catalog.model.ts` | Select de suscriptores |
| `Agent` | `core/models/catalog.model.ts` | Select de agentes filtrado |
| `QuoteStatus` | `core/models/folio.model.ts` | Tipo del estado de la cotización |
| `QuoteState` | `core/models/folio.model.ts` | Estado global del folio |

---

### API Endpoints

#### GET /v1/quotes/{folio}/general-info
- **Descripción**: Carga los datos generales de una cotización existente
- **Path param**: `folio` — ej. `FOL-2026-00042`
- **Response 200**:
  ```json
  {
    "folioNumber": "FOL-2026-00042",
    "quoteStatus": "IN_PROGRESS",
    "insuredData": {
      "name": "Empresa Ejemplo SA de CV",
      "rfc": "EEJ900101ABC",
      "email": "contacto@empresa.com",
      "phone": "5512345678"
    },
    "underwritingData": {
      "agentCode": "AGT-123",
      "subscriberId": "SUB-001",
      "riskClassification": "STANDARD",
      "businessType": "COMMERCIAL"
    },
    "updatedAt": "2026-04-20T15:00:00Z",
    "version": 2
  }
  ```
- **Response 404**: `{ "error": "Folio not found", "code": "FOLIO_NOT_FOUND" }`

#### PUT /v1/quotes/{folio}/general-info
- **Descripción**: Actualiza los datos generales. Requiere `version` para control de concurrencia optimista.
- **Request body**:
  ```json
  {
    "insuredData": {
      "name": "Empresa Ejemplo SA de CV",
      "rfc": "EEJ900101ABC",
      "email": "contacto@empresa.com",
      "phone": "5512345678"
    },
    "underwritingData": {
      "agentCode": "AGT-123",
      "subscriberId": "SUB-001",
      "riskClassification": "STANDARD",
      "businessType": "COMMERCIAL"
    },
    "version": 2
  }
  ```
- **Response 200**: `GeneralInfoResponse` con `version: 3`
- **Response 409**: `{ "error": "Optimistic lock conflict", "code": "VERSION_CONFLICT" }`
- **Response 404**: `{ "error": "Folio not found", "code": "FOLIO_NOT_FOUND" }`
- **Response 422**: `{ "error": "Validation failed", "code": "VALIDATION_ERROR", "fields": [...] }`

#### Endpoints de catálogos (ya implementados en CatalogService)
| Endpoint | Descripción |
|----------|-------------|
| `GET /v1/subscribers` | Lista suscriptores — consumido por `CatalogService.obtenerSuscriptores()` |
| `GET /v1/agents` | Lista todos los agentes — filtrado localmente en el componente por `subscriberId` |

---

### Diseño Frontend

#### Componentes nuevos

| Componente | Nivel Atomic | Archivo | Descripción |
|------------|-------------|---------|-------------|
| `InsuredDataFormComponent` | Organism | `features/cotizador/components/insured-data-form/insured-data-form.component.ts` | Tarjeta "Asegurado" con grid 2 col y badge de completitud |
| `UnderwritingDataFormComponent` | Organism | `features/cotizador/components/underwriting-data-form/underwriting-data-form.component.ts` | Tarjeta "Suscripción" con selects y alerta de versionado |

#### Página (ya scaffolded — reemplazar stub)

| Página | Archivo | Ruta | Descripción |
|--------|---------|------|-------------|
| `GeneralInfoPage` | `features/cotizador/pages/general-info.page.ts` | `/quotes/:folioNumber/general-info` | Paso 1 — compone ambos organisms, consume `GeneralInfoService` |

#### Servicio nuevo (TDD obligatorio)

| Servicio | Archivo | Métodos |
|----------|---------|---------|
| `GeneralInfoService` | `features/cotizador/services/general-info.service.ts` | `cargar(folio)`, `guardar(folio, request)` |

#### Descripción detallada de componentes

**`InsuredDataFormComponent`**
- Recibe `@Input() form: FormGroup` (grupo `insuredData` del FormGroup padre)
- Recibe `@Input() isComplete: boolean` — controla el Badge (variant `ok` si true, `warn` si false)
- Grid 2 columnas con campos: Razón social, RFC (mono, maxlength=13, upperCase), Correo, Teléfono
- Los átomos `InputComponent`, `FieldComponent`, `BadgeComponent` ya existen en `shared/ui/atoms/`
- Validaciones Angular Reactive Forms: `Validators.required`, RFC custom validator, `Validators.email`, patrón solo dígitos

**`UnderwritingDataFormComponent`**
- Recibe `@Input() form: FormGroup` (grupo `underwritingData` del FormGroup padre)
- Recibe `@Input() subscribers: Subscriber[]` y `@Input() agents: Agent[]`
- `@Output() subscriberChanged: EventEmitter<string>` — emite el nuevo `subscriberId` para que la página filtre agentes
- Select Suscriptor, Select Agente (opciones = `agents` recibidos como input), Select Clasificación, Select Tipo de negocio
- Alerta informativa: "Versionado optimista activo — versión actual: vN" recibe `@Input() version: number`
- El átomo `SelectComponent` ya existe en `shared/ui/atoms/select/`

**`GeneralInfoPage`**
- Lee `folioNumber` desde `ActivatedRoute.params`
- En `ngOnInit`: llama `GeneralInfoService.cargar(folio)` y `CatalogService.obtenerSuscriptores()` + `CatalogService.obtenerAgentes()` con `forkJoin`
- Construye un `FormGroup` raíz con grupos `insuredData` y `underwritingData`
- Al cambiar el suscriptor, filtra la lista de agentes localmente
- Al pulsar "Guardar": valida el FormGroup completo; si es válido llama `GeneralInfoService.guardar(folio, { insuredData, underwritingData, version })`
  - Éxito: actualiza `version` en el estado local y navega al siguiente paso (`/quotes/:folio/layout`)
  - Error 409: muestra mensaje de conflicto
  - Error 422: mapea errores a los campos del formulario
- Utiliza `takeUntilDestroyed()` en todas las suscripciones

#### Pipe de transformación (nuevo, TDD obligatorio)

| Pipe | Archivo | Descripción |
|------|---------|-------------|
| `UpperCaseRfcDirective` | `features/cotizador/directives/upper-case-rfc.directive.ts` | Directive de atributo que convierte input a mayúsculas en tiempo real vía `HostListener('input')`. Alternativa: transformación en `valueChanges` del FormControl. **La elección se deja al implementador**, pero debe cubrirse con test. |

> **Nota de implementación**: La conversión de RFC a mayúsculas puede implementarse como directive Angular (`UpperCaseRfcDirective`) aplicada al `InputComponent`, o como transformación en el `valueChanges` del FormControl RFC en el organism. Ambas son válidas. El test debe cubrir que el valor almacenado en el FormControl sea siempre mayúsculas.

#### Servicios existentes consumidos

| Servicio | Método | Uso |
|----------|--------|-----|
| `CatalogService` | `obtenerSuscriptores()` | Poblar el select de suscriptores |
| `CatalogService` | `obtenerAgentes()` | Base para filtrar agentes por suscriptor |
| `QuoteStateService` | `obtenerEstado(folio)` | (Opcional) Cargar estado inicial si `GeneralInfoService.cargar` no retorna suficiente contexto |

#### Validator RFC personalizado

```typescript
// RFC persona moral: 12 chars — /^[A-Z&Ñ]{3}\d{6}[A-Z\d]{3}$/
// RFC persona física: 13 chars — /^[A-Z&Ñ]{4}\d{6}[A-Z\d]{3}$/
export function rfcValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = (control.value ?? '').toUpperCase();
    const moralRfc  = /^[A-Z&Ñ]{3}\d{6}[A-Z0-9]{3}$/;
    const fisicaRfc = /^[A-Z&Ñ]{4}\d{6}[A-Z0-9]{3}$/;
    if (!val) return null; // required validator handles empty
    return (moralRfc.test(val) || fisicaRfc.test(val)) ? null : { invalidRfc: true };
  };
}
```

---

### Arquitectura y Dependencias

- **Paquetes nuevos**: ninguno. Usa `ReactiveFormsModule`, `HttpClientModule`, `RxJS` ya presentes.
- **Servicios externos**: Backend quoter en `environment.apiUrl`, Core en `environment.coreUrl` (ya configurados en `AppConfigService`).
- **Ruta**: ya registrada en `COTIZADOR_ROUTES` como `{ path: 'general-info', component: GeneralInfoPage }` dentro del padre `quotes/:folioNumber`. No requiere cambios en rutas.
- **Impacto en otros módulos**: ninguno. El `GeneralInfoService` es standalone (`providedIn: 'root'`).

### Notas de Implementación

1. `CatalogService` ya consume `GET /v1/subscribers` y `GET /v1/agents` con `shareReplay(1)`. **No crear un segundo servicio HTTP para catálogos**; reutilizar `CatalogService`.
2. El filtrado de agentes por suscriptor es **local** (sobre el array ya cargado), no una nueva llamada HTTP. El contrato API define `GET /v1/agents?subscriberId=X` pero dado que `CatalogService` ya carga todos los agentes con `shareReplay`, la estrategia local es la correcta para este sprint.
3. La versión del folio se almacena en `GeneralInfoPage` como estado local (signal o propiedad) y se sincroniza con la respuesta de cada PUT. El `QuoteStateService` no persiste versión actualmente; no modificar ese servicio en este feature.
4. El `StatusBar` existente (`shared/ui/organisms/status-bar`) recibe datos vía `@Input()`. Si el StatusBar necesita mostrar la versión, el `GeneralInfoPage` debe pasarle el dato actualizado tras cada guardado.
5. `SectionHeaderComponent` ya existe en `shared/ui/atoms/section-header/`. Usar `eyebrow` y `title` según el JSX prototipo.

---

## 3. LISTA DE TAREAS

> Checklist accionable para el agente frontend-developer. Marcar cada ítem (`[x]`) al completarlo.

### Frontend

#### Modelos
- [x] Crear `features/cotizador/models/general-info.model.ts` con interfaces `InsuredData`, `UnderwritingData`, `GeneralInfoRequest`, `GeneralInfoResponse` y tipos `RiskClassification`, `BusinessType`

#### Servicio (TDD: escribir spec ANTES del servicio)
- [x] Crear `features/cotizador/services/general-info.service.spec.ts` (tests RED)
  - [x] `cargar(folio)` — emite `GeneralInfoResponse` en éxito
  - [x] `cargar(folio)` — propaga error 404
  - [x] `guardar(folio, request)` — llama PUT con body correcto y retorna `GeneralInfoResponse`
  - [x] `guardar(folio, request)` — propaga error 409 `VERSION_CONFLICT`
  - [x] `guardar(folio, request)` — propaga error 422 `VALIDATION_ERROR`
- [x] Implementar `features/cotizador/services/general-info.service.ts` (tests GREEN)

#### Validator RFC (TDD)
- [x] Crear `features/cotizador/validators/rfc.validator.spec.ts`
  - [x] RFC persona moral válido (12 chars) → null
  - [x] RFC persona física válido (13 chars) → null
  - [x] RFC inválido (longitud incorrecta) → `{ invalidRfc: true }`
  - [x] RFC con minúsculas → inválido (después de normalización)
  - [x] Control vacío → null (required lo maneja)
- [x] Implementar `features/cotizador/validators/rfc.validator.ts`

#### Conversión RFC a mayúsculas
- [x] Implementar conversión a mayúsculas (directive `UpperCaseRfcDirective` o via `valueChanges`). Incluir test unitario que demuestre que el FormControl siempre almacena en mayúsculas.

#### Componentes (sin tests de template — solo lógica en services/validators)
- [x] Implementar `InsuredDataFormComponent` (organism)
  - `.ts`: recibe `@Input() form: FormGroup`, `@Input() isComplete: boolean`
  - `.html`: grid 2 col con `FieldComponent` + `InputComponent` + `BadgeComponent`
  - `.scss`: estilos de tarjeta con borde y padding
- [x] Implementar `UnderwritingDataFormComponent` (organism)
  - `.ts`: recibe `@Input() form: FormGroup`, `@Input() subscribers`, `@Input() agents`, `@Input() version: number`
  - `.ts`: `@Output() subscriberChanged: EventEmitter<string>`
  - `.html`: grid 2 col con `SelectComponent` + alerta informativa con `version`
  - `.scss`: estilos de tarjeta
- [x] Reemplazar stub en `GeneralInfoPage` con implementación completa
  - Leer `folioNumber` desde `ActivatedRoute.params`
  - `forkJoin` para cargar datos de la cotización + catálogos
  - `FormGroup` reactivo con grupos `insuredData` y `underwritingData`
  - Filtrado local de agentes al cambiar suscriptor
  - Manejo de errores 409 y 422
  - Navegación a `/quotes/:folio/layout` tras guardado exitoso

#### Rutas
- [x] Verificar que `COTIZADOR_ROUTES` sigue apuntando a `GeneralInfoPage` (ruta ya definida, no requiere cambios)

### QA
- [ ] Ejecutar `/gherkin-case-generator` → escenarios CRITERIO-1.1 a 3.1
- [ ] Ejecutar `/risk-identifier` → clasificación ASD de riesgos
- [x] Verificar cobertura ≥ 80% en `GeneralInfoService` y `rfcValidator`
- [x] Validar que los criterios de aceptación están cubiertos por los tests
- [x] Actualizar estado spec: `status: IMPLEMENTED`
