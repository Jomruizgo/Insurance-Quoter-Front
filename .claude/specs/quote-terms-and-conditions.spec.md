---
id: SPEC-010
status: DRAFT
feature: quote-terms-and-conditions
created: 2026-04-23
updated: 2026-04-23
author: spec-generator
version: "1.0"
related-specs:
  - SPEC-009  # quote-calculation (fuente de CalculationResult y el paso previo)
  - SPEC-006  # app-shell (StatusBar que se actualiza con quoteStatus)
  - SPEC-001  # general-info (GeneralInfoService.cargar() ya existe)
---

# Spec: Términos y Condiciones (Paso 6/5 — Cierre del Folio)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Pantalla final del wizard de cotización, accesible en `/quotes/:folio/terms-and-conditions`. Presenta un resumen ejecutivo de la cotización calculada y requiere la aceptación explícita de términos y condiciones por parte del agente/representante antes de finalizar el folio. Al aceptar, el folio transiciona de `CALCULATED` a `ISSUED`. La pantalla solo es accesible si el folio tiene `quoteStatus === 'CALCULATED'`; en cualquier otro estado redirige a `/quotes/:folio/calculation`.

### Requerimiento de Negocio

El Reto técnico exige la ruta `/quotes/:folio/terms-and-conditions` como último paso del flujo. La pantalla cierra el ciclo de vida del folio: el agente revisa un resumen ejecutivo, lee las condiciones del seguro de daños y declara formalmente su aceptación antes de emitir la cotización. El folio queda en estado `ISSUED` una vez aceptado.

### Historias de Usuario

#### HU-01: Revisar el resumen ejecutivo de la cotización

```
Como:        Agente de cotización
Quiero:      Ver un resumen compacto del folio (cliente, primas, ubicaciones) antes de aceptar
Para:        Confirmar que los datos calculados son correctos antes de comprometer la emisión

Prioridad:   Alta
Estimación:  S (2 puntos)
Dependencias: SPEC-009 (CalculationResult disponible)
Capa:        Frontend
```

#### HU-02: Leer y aceptar los términos y condiciones

```
Como:        Agente de cotización
Quiero:      Ver el texto completo de los términos, marcar ambos checkboxes y proporcionar
             el nombre del aceptante para habilitar el botón de finalización
Para:        Cumplir con el requisito de aceptación explícita antes de emitir la póliza

Prioridad:   Alta
Estimación:  M (3 puntos)
Dependencias: HU-01
Capa:        Frontend
```

#### HU-03: Finalizar el folio y obtener confirmación

```
Como:        Agente de cotización
Quiero:      Hacer click en "Aceptar y finalizar cotización" y ver el estado ISSUED confirmado
             en pantalla de forma inmediata
Para:        Saber que la cotización ha sido emitida correctamente sin volver al dashboard

Prioridad:   Alta
Estimación:  S (2 puntos)
Dependencias: HU-02, endpoint POST /v1/quotes/{folio}/accept
Capa:        Frontend + Backend (deuda técnica documentada)
```

### Criterios de Aceptación (Gherkin)

```gherkin
Feature: Términos y condiciones del folio

  Background:
    Given el agente está autenticado en el sistema
    And existe el folio "FOL-2026-00042" con version 8 y quoteStatus "CALCULATED"
    And el cálculo retornó netPremium 48500.00, commercialPremium 56260.00
    And el folio tiene cliente "Empresa ABC S.A. de C.V.", suscriptor "SUB-001", agente "AGT-007"

  # --- Acceso y guard ---

  Scenario: Acceso permitido con folio CALCULATED
    When el agente navega a /quotes/FOL-2026-00042/terms-and-conditions
    Then la pantalla se muestra correctamente con el resumen ejecutivo
    And la cabecera muestra "Folio FOL-2026-00042 · Términos y condiciones"

  Scenario: Acceso denegado si quoteStatus no es CALCULATED
    Given el folio tiene quoteStatus "IN_PROGRESS"
    When el agente navega a /quotes/FOL-2026-00042/terms-and-conditions
    Then el router redirige a /quotes/FOL-2026-00042/calculation

  # --- Resumen ejecutivo ---

  Scenario: Visualizar QuoteSummaryCardComponent
    When la pantalla está visible
    Then el QuoteSummaryCardComponent muestra:
      | campo               | valor                              |
      | Folio               | FOL-2026-00042                     |
      | Cliente             | Empresa ABC S.A. de C.V.           |
      | Suscriptor          | SUB-001                            |
      | Agente              | AGT-007                            |
      | Número de ubicaciones | 2                                |
      | Fecha de cálculo    | fecha formateada (DD MMM YYYY HH:mm)|
      | Prima neta total    | MXN 48,500.00                      |
      | Prima comercial total| MXN 56,260.00                     |
      | Badge de estado     | "EMITIDA" con variante brand       |
    And lista las ubicaciones calculables con su prima individual

  Scenario: Lista de ubicaciones solo muestra calculables
    Given el folio tiene 1 ubicación calculable y 1 no calculable
    When el QuoteSummaryCardComponent es visible
    Then solo muestra la ubicación calculable con su prima
    And no muestra la ubicación con calculable === false

  # --- Términos y condiciones ---

  Scenario: Bloque de términos es scrollable
    When la pantalla está visible
    Then el TermsAndConditionsTextComponent tiene altura máxima fija de 320px
    And es scrollable verticalmente cuando el contenido excede la altura
    And contiene las cinco secciones de condiciones generales

  # --- Formulario de aceptación ---

  Scenario: Botón deshabilitado hasta completar todos los campos
    Given ambos checkboxes están desmarcados y el nombre está vacío
    When el agente visualiza el AcceptanceFormComponent
    Then el botón "Aceptar y finalizar cotización" está deshabilitado

  Scenario: Botón deshabilitado con solo un checkbox marcado
    Given el agente marca el primer checkbox pero no el segundo
    And el campo de nombre tiene "Juan Pérez"
    Then el botón "Aceptar y finalizar cotización" está deshabilitado

  Scenario: Botón habilitado con ambos checkboxes y nombre completo
    Given el agente marca "He leído y acepto los términos y condiciones"
    And el agente marca "Declaro que la información proporcionada es verídica y completa"
    And el agente escribe "Juan Pérez López" en el campo de nombre
    Then el botón "Aceptar y finalizar cotización" está habilitado

  Scenario: Nombre vacío aunque checkboxes marcados deshabilita el botón
    Given el agente marca ambos checkboxes
    And el campo de nombre está vacío
    Then el botón "Aceptar y finalizar cotización" está deshabilitado

  # --- Barra de finalización ---

  Scenario: QuoteFinalizationBarComponent muestra timestamp
    When la pantalla está visible
    Then la barra inferior muestra "Cotización calculada el [fecha formateada]"
    And el botón "Descargar PDF" está visible (acción: window.print())
    And el botón "Aceptar y finalizar cotización" refleja el estado del formulario

  # --- Aceptación exitosa ---

  Scenario: Aceptación exitosa — folio pasa a ISSUED
    Given el formulario está completo y el botón habilitado
    When el agente hace click en "Aceptar y finalizar cotización"
    Then el sistema llama POST /v1/quotes/FOL-2026-00042/accept con body:
      | campo       | valor        |
      | acceptedBy  | Juan Pérez López |
      | version     | 8            |
    And la pantalla muestra el spinner durante la petición
    And al recibir respuesta 200 se muestra el estado de confirmación inline:
      "Cotización finalizada · Folio FOL-2026-00042"
    And el StatusBar refleja quoteStatus "ISSUED"
    And el formulario de aceptación queda deshabilitado
    And el botón "Volver al panel" es visible y navega a /cotizador

  Scenario: Error 409 — conflicto de versión al aceptar
    Given el backend retorna 409 con code "VERSION_CONFLICT"
    When el agente hace click en "Aceptar y finalizar cotización"
    Then se muestra el mensaje de error:
      "El folio fue modificado por otro usuario. Recarga la página para continuar."
    And el formulario permanece editable para reintentar

  Scenario: Error 422 — folio no está en estado CALCULATED
    Given el backend retorna 422 con code "INVALID_STATUS_TRANSITION"
    When el agente hace click en "Aceptar y finalizar cotización"
    Then se muestra el mensaje de error:
      "No se puede finalizar el folio. Verifica que el cálculo esté vigente."

  # --- Navegación ---

  Scenario: Volver al resultado desde la cabecera
    When el agente hace click en "Volver al resultado"
    Then el router navega a /quotes/FOL-2026-00042/calculation
```

### Reglas de Negocio

| ID | Regla |
|----|-------|
| RN-01 | La pantalla solo es accesible si `quoteStatus === 'CALCULATED'`; el guard redirige a `/quotes/:folio/calculation` en cualquier otro estado. |
| RN-02 | El botón "Aceptar y finalizar cotización" solo se habilita cuando ambos checkboxes están marcados Y el campo `acceptedBy` tiene al menos 3 caracteres (sin espacios iniciales/finales). |
| RN-03 | La lista de ubicaciones en `QuoteSummaryCardComponent` solo incluye las que tienen `calculable === true`. |
| RN-04 | La vigencia de la cotización es de **30 días** a partir de `calculatedAt`. Se muestra en el texto de términos y en la barra de finalización. |
| RN-05 | El endpoint `POST /v1/quotes/{folio}/accept` es **deuda técnica pendiente** en el backend. En esta fase, si el endpoint no existe, el service usa una respuesta optimista mockeada (ver sección 2.3). |
| RN-06 | Tras aceptar exitosamente, se llama `QuoteStateService.refresh()` para que el StatusBar actualice el estado a `ISSUED`. |
| RN-07 | El botón "Descargar PDF" llama a `window.print()` en esta fase (sin integración de generación de PDF real). |
| RN-08 | Una vez que la respuesta de aceptación es exitosa, el formulario queda bloqueado (disabled) y el estado de confirmación es permanente en la sesión actual. |
| RN-09 | `commercialPremium` siempre es `netPremium × 1.16`; el frontend solo lo muestra tal como llega del backend. |

---

## 2. DISEÑO

### 2.1 Modelos TypeScript

**Archivo:** `src/app/features/cotizador/models/terms.model.ts` *(nuevo)*

```typescript
export interface AcceptanceRequest {
  acceptedBy: string;
  version: number;
}

export interface AcceptanceResponse {
  folioNumber: string;
  quoteStatus: 'ISSUED';
  acceptedBy: string;
  acceptedAt: string;   // ISO 8601 UTC
  version: number;
}
```

> `CalculationResult`, `LocationPremium` y `GeneralInfoResponse` ya existen — no duplicar.

### 2.2 Endpoints de API

#### [NUEVO — Deuda técnica] GET /v1/quotes/{folio}/calculation-result

Permite cargar el resultado de cálculo previo cuando el usuario navega directamente a la URL (sin estado de router). Se propone para el backend como extensión del contrato.

| Campo | Valor |
|-------|-------|
| Método | `GET` |
| Ruta | `/v1/quotes/{folio}/calculation-result` |
| Auth | Bearer token (si aplica) |

**Response 200:** igual que el response 200 de `POST /v1/quotes/{folio}/calculate` (ver SPEC-009 § 2.2)

**Response 404:** folio no existe o no ha sido calculado aún

**Response 409:** `{ "error": "...", "code": "VERSION_CONFLICT" }`

> **Estado:** endpoint propuesto — no confirmado en `api-contracts.md`. Documentar como pendiente de implementación backend.

---

#### [NUEVO — Deuda técnica] POST /v1/quotes/{folio}/accept

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Ruta | `/v1/quotes/{folio}/accept` |
| Auth | Bearer token (si aplica) |

**Request body:**
```json
{
  "acceptedBy": "Juan Pérez López",
  "version": 8
}
```

**Response 200:**
```json
{
  "folioNumber": "FOL-2026-00042",
  "quoteStatus": "ISSUED",
  "acceptedBy": "Juan Pérez López",
  "acceptedAt": "2026-04-23T18:30:00Z",
  "version": 9
}
```

**Response 409:**
```json
{ "error": "Optimistic lock conflict", "code": "VERSION_CONFLICT" }
```

**Response 422:**
```json
{ "error": "Cannot transition to ISSUED", "code": "INVALID_STATUS_TRANSITION" }
```

> **Estado:** endpoint propuesto — no existe en `api-contracts.md`. El service usa **respuesta optimista mockeada** (ver § 2.3) hasta que el backend lo implemente.

### 2.3 Services

#### TermsService *(nuevo)*

**Archivo:** `src/app/features/cotizador/services/terms.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class TermsService {
  aceptar(
    folio: string,
    acceptedBy: string,
    version: number
  ): Observable<AcceptanceResponse>
  // POST /v1/quotes/{folio}/accept
  // body: { acceptedBy, version }
  // Si el endpoint retorna 404 (no implementado aún), usa respuesta optimista:
  //   { folioNumber: folio, quoteStatus: 'ISSUED', acceptedBy, acceptedAt: new Date().toISOString(), version: version + 1 }
  // Propaga HttpErrorResponse para 409 y 422.
}
```

**Test:** `src/app/features/cotizador/services/terms.service.spec.ts`

Casos TDD requeridos:
1. `aceptar()` hace POST a la URL correcta con el body `{ acceptedBy, version }`
2. Retorna `Observable<AcceptanceResponse>` en respuesta 200 con `quoteStatus: 'ISSUED'`
3. Propaga el error en respuesta 409 con `code: VERSION_CONFLICT`
4. Propaga el error en respuesta 422 con `code: INVALID_STATUS_TRANSITION`

---

#### CalculationService — método adicional *(extensión de servicio existente)*

**Archivo:** `src/app/features/cotizador/services/calculation.service.ts`

Agregar el método:

```typescript
obtenerResultado(folio: string): Observable<CalculationResult>
// GET /v1/quotes/{folio}/calculation-result
// Carga el resultado de cálculo previo para folios en estado CALCULATED
```

**Test adicional en:** `src/app/features/cotizador/services/calculation.service.spec.ts`

Casos TDD requeridos:
1. `obtenerResultado()` hace GET a la URL correcta
2. Retorna `Observable<CalculationResult>` en respuesta 200
3. Propaga el error en respuesta 404

### 2.4 Guard

#### TermsGuard *(nuevo)*

**Archivo:** `src/app/features/cotizador/guards/terms.guard.ts`

```typescript
// canActivate: verifica QuoteStateService.obtenerEstado(folio)
// Si quoteStatus === 'CALCULATED' → permite el acceso
// Cualquier otro status → redirige a /quotes/:folio/calculation
// Implementar como función canActivateFn (Angular 19 functional guards)
```

> El guard usa `QuoteStateService.obtenerEstado()` que ya existe.

### 2.5 Diseño de Componentes (Atomic Design)

#### Ruta de la página

```
/quotes/:folio/terms-and-conditions  →  TermsPage (ya existe como stub en terms.page.ts)
```

#### Árbol de componentes

```
TermsPage (Page) — reemplaza el stub existente
├── QuoteSummaryCardComponent (Organism)    ← resumen ejecutivo
│   ├── BadgeComponent (Atom)               ← ya existe en shared/ui/atoms/badge/
│   └── [lista de ubicaciones calculables]
├── TermsAndConditionsTextComponent (Organism) ← bloque de texto T&C scrollable
├── AcceptanceFormComponent (Organism)      ← checkboxes + nombre
│   ├── InputComponent (Atom)               ← ya existe en shared/ui/atoms/input/
│   └── [checkboxes nativos con label]
└── QuoteFinalizationBarComponent (Organism) ← barra fija al pie
    └── BtnComponent (Atom)                 ← ya existe en shared/ui/atoms/btn/
```

#### Archivos a crear

| Artefacto | Ruta |
|-----------|------|
| Model | `src/app/features/cotizador/models/terms.model.ts` |
| Service | `src/app/features/cotizador/services/terms.service.ts` |
| Service test | `src/app/features/cotizador/services/terms.service.spec.ts` |
| Guard | `src/app/features/cotizador/guards/terms.guard.ts` |
| Guard test | `src/app/features/cotizador/guards/terms.guard.spec.ts` |
| Organism summary card | `src/app/features/cotizador/components/quote-summary-card/quote-summary-card.component.ts` |
| Organism summary card HTML | `src/app/features/cotizador/components/quote-summary-card/quote-summary-card.component.html` |
| Organism summary card SCSS | `src/app/features/cotizador/components/quote-summary-card/quote-summary-card.component.scss` |
| Organism T&C text | `src/app/features/cotizador/components/terms-and-conditions-text/terms-and-conditions-text.component.ts` |
| Organism T&C text HTML | `src/app/features/cotizador/components/terms-and-conditions-text/terms-and-conditions-text.component.html` |
| Organism T&C text SCSS | `src/app/features/cotizador/components/terms-and-conditions-text/terms-and-conditions-text.component.scss` |
| Organism acceptance form | `src/app/features/cotizador/components/acceptance-form/acceptance-form.component.ts` |
| Organism acceptance form HTML | `src/app/features/cotizador/components/acceptance-form/acceptance-form.component.html` |
| Organism acceptance form SCSS | `src/app/features/cotizador/components/acceptance-form/acceptance-form.component.scss` |
| Organism finalization bar | `src/app/features/cotizador/components/quote-finalization-bar/quote-finalization-bar.component.ts` |
| Organism finalization bar HTML | `src/app/features/cotizador/components/quote-finalization-bar/quote-finalization-bar.component.html` |
| Organism finalization bar SCSS | `src/app/features/cotizador/components/quote-finalization-bar/quote-finalization-bar.component.scss` |

#### Archivos a modificar

| Artefacto | Ruta | Cambio |
|-----------|------|--------|
| TermsPage (stub) | `src/app/features/cotizador/pages/terms.page.ts` | Reemplazar stub con implementación completa |
| CalculationService | `src/app/features/cotizador/services/calculation.service.ts` | Agregar `obtenerResultado()` |
| cotizador.routes.ts | `src/app/features/cotizador/cotizador.routes.ts` | Agregar `canActivate: [TermsGuard]` a la ruta `terms-and-conditions` |

#### Contratos de I/O de componentes

**QuoteSummaryCardComponent**
```typescript
@Input() folioNumber: string;
@Input() result: CalculationResult;         // primas, ubicaciones, calculatedAt
@Input() generalInfo: GeneralInfoResponse;  // cliente, suscriptor, agente
```

**TermsAndConditionsTextComponent**
```typescript
// Sin @Input — el texto es estático (condiciones generales del seguro de daños)
// Requiere CSS: max-height: 320px; overflow-y: auto;
```

**AcceptanceFormComponent**
```typescript
@Output() formChange = new EventEmitter<{ valid: boolean; acceptedBy: string }>();
// Internamente usa ReactiveFormsModule:
// - termsAccepted: FormControl<boolean> (requerido: true)
// - truthDeclaration: FormControl<boolean> (requerido: true)
// - acceptedBy: FormControl<string> (requerido: minLength 3)
// Emite en cada cambio; la Page decide si habilitar el botón
```

**QuoteFinalizationBarComponent**
```typescript
@Input() calculatedAt: string;    // ISO 8601 — formatea a "DD MMM YYYY HH:mm"
@Input() submitEnabled: boolean;  // controla el botón de aceptación
@Input() accepting: boolean;      // spinner en progreso
@Output() accept = new EventEmitter<void>();
@Output() downloadPdf = new EventEmitter<void>();  // dispara window.print()
```

#### TermsPage — responsabilidades

```typescript
// Inyecta: ActivatedRoute, CalculationService, GeneralInfoService,
//          TermsService, QuoteStateService, Router
//
// Al iniciar:
//   - Lee folio de ActivatedRoute.snapshot.params
//   - Lee CalculationResult desde Router state (extras.state['result'])
//     o llama CalculationService.obtenerResultado(folio) si state no está disponible
//   - Llama GeneralInfoService.cargar(folio) en paralelo con forkJoin
//
// Estado local:
//   result: CalculationResult | null = null
//   generalInfo: GeneralInfoResponse | null = null
//   loading = true
//   accepting = false
//   accepted = false
//   error: string | null = null
//   acceptancePayload: { valid: boolean; acceptedBy: string } = { valid: false, acceptedBy: '' }
//
// onFormChange(payload): actualiza acceptancePayload
// onAccept(): llama TermsService.aceptar(folio, acceptedBy, result.version)
//   - success: accepted = true, quoteStateService.refresh()
//   - error 409: mostrar mensaje VERSION_CONFLICT
//   - error 422: mostrar mensaje INVALID_STATUS_TRANSITION
// onDownloadPdf(): window.print()
// onBack(): navega a /quotes/:folio/calculation
// onBackToDashboard(): navega a /cotizador (visible solo tras aceptación)
//
// get submitEnabled(): boolean
//   → acceptancePayload.valid && !accepting && !accepted
```

### 2.6 Texto de Términos y Condiciones

El `TermsAndConditionsTextComponent` muestra el siguiente contenido estático en español (cinco secciones):

**a. Veracidad de la información**
> El solicitante declara bajo protesta de decir verdad que toda la información proporcionada en esta cotización es exacta, completa y refleja fielmente las condiciones del riesgo a asegurar. Cualquier omisión o inexactitud podrá ser causa de nulidad de la póliza o negativa de pago de siniestros conforme a lo establecido en el artículo 8 de la Ley sobre el Contrato de Seguro.

**b. Vigencia y validez de la cotización**
> Esta cotización tiene una vigencia de **30 días naturales** a partir de la fecha de cálculo indicada en el encabezado. Transcurrido dicho plazo sin que se haya emitido la póliza correspondiente, los montos de prima quedarán sin efecto y será necesario generar una nueva cotización sujeta a las condiciones de tarifa vigentes en ese momento.

**c. Condiciones para la emisión de la póliza**
> La emisión efectiva de la póliza estará condicionada a: (i) la aceptación por parte del área de suscripción de los riesgos presentados; (ii) el pago oportuno de la prima neta en los plazos y formas acordados; (iii) la verificación física del riesgo cuando así lo determine la aseguradora; y (iv) la no existencia de siniestros previos no declarados en las propiedades objeto de la cotización.

**d. Tratamiento de datos personales (LFPDPPP)**
> Los datos personales recabados en este proceso serán tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento. El responsable del tratamiento es la entidad aseguradora emisora. Los datos se utilizarán exclusivamente para la emisión, administración y renovación del contrato de seguro, así como para el cumplimiento de obligaciones legales y regulatorias. El titular podrá ejercer sus derechos ARCO (Acceso, Rectificación, Cancelación u Oposición) en cualquier momento mediante escrito dirigido al área de privacidad indicada en el Aviso de Privacidad Integral disponible en el portal de la aseguradora.

**e. Limitaciones de cobertura**
> Las garantías incluidas en esta cotización amparan únicamente los riesgos y sumas aseguradas expresamente consignados en el presente documento. Quedan excluidos de manera enunciativa, más no limitativa: daños por dolo o negligencia grave del asegurado; bienes no declarados en la propuesta; eventos producidos con anterioridad a la vigencia de la póliza; y los riesgos catalogados como excluidos en las Condiciones Generales del producto de Seguro de Daños aplicable. Las coberturas específicas contratadas determinan el alcance máximo de la indemnización conforme al deducible y coaseguro pactados.

### 2.7 Integración con QuoteStateService y StatusBar

- Tras una aceptación exitosa, la page llama `QuoteStateService.refresh()`.
- El `AppShellComponent` (SPEC-006) ya está suscrito a `refresh$` y actualiza el StatusBar con el nuevo `quoteStatus: 'ISSUED'`.
- El guard llama `QuoteStateService.obtenerEstado(folio)` en cada acceso a la ruta.

### 2.8 Estrategia de carga del CalculationResult

1. **Caso A — Navegación desde CalculationPage:** la page recibe `CalculationResult` en `Router.navigate()` extras state (`state: { result }`). La TermsPage lo lee de `this.router.getCurrentNavigation()?.extras.state?.['result']`.
2. **Caso B — Acceso directo por URL:** si el state no está disponible, la page llama `CalculationService.obtenerResultado(folio)`. Si el endpoint aún no existe (404), muestra un mensaje de error y ofrece navegar de vuelta a `/quotes/:folio/calculation`.

---

## 3. LISTA DE TAREAS

### Frontend

#### Modelos y Service (TDD — Red → Green → Refactor)
- [ ] FE-01: Crear `terms.model.ts` con `AcceptanceRequest` y `AcceptanceResponse`
- [ ] FE-02: Escribir tests de `TermsService` (RED): POST correcto, response 200 ISSUED, errores 409 y 422
- [ ] FE-03: Implementar `TermsService.aceptar()` hasta pasar los tests (GREEN)
- [ ] FE-04: Refactorizar `TermsService` si aplica (REFACTOR)
- [ ] FE-05: Escribir tests de `CalculationService.obtenerResultado()` (RED): GET correcto, response 200, error 404
- [ ] FE-06: Implementar `CalculationService.obtenerResultado()` hasta pasar los tests (GREEN)

#### Guard (TDD)
- [ ] FE-07: Escribir tests de `TermsGuard` (RED): permite CALCULATED, redirige en otros estados
- [ ] FE-08: Implementar `TermsGuard` como `canActivateFn` (GREEN)
- [ ] FE-09: Registrar `TermsGuard` en la ruta `terms-and-conditions` de `cotizador.routes.ts`

#### Componentes UI (sin tests — solo lógica en el service)
- [ ] FE-10: Implementar `QuoteSummaryCardComponent` con @Input result + generalInfo, lista de ubicaciones calculables, primas formateadas MXN, badge CALCULATED/ISSUED
- [ ] FE-11: Implementar `TermsAndConditionsTextComponent` con las 5 secciones estáticas de texto y estilo scrollable (max-height: 320px; overflow-y: auto)
- [ ] FE-12: Implementar `AcceptanceFormComponent` con `ReactiveFormsModule`, los dos checkboxes y el campo `acceptedBy` (minLength 3); emitir `formChange` en cada cambio
- [ ] FE-13: Implementar `QuoteFinalizationBarComponent` con timestamp formateado, botón "Descargar PDF" (window.print()), botón "Aceptar y finalizar" con @Input submitEnabled y spinner

#### TermsPage — integración
- [ ] FE-14: Reemplazar stub de `TermsPage` con implementación completa:
  - Carga paralela con `forkJoin`: CalculationResult (state o GET) + GeneralInfoResponse
  - Estado local: loading, accepting, accepted, error, acceptancePayload
  - `onFormChange()` — actualiza acceptancePayload
  - `onAccept()` — llama TermsService.aceptar(), manejo de errores 409/422, refresh StatusBar
  - `onDownloadPdf()` — window.print()
  - `onBack()` — navega a /quotes/:folio/calculation
  - `onBackToDashboard()` — visible tras accepted=true, navega a /cotizador
  - Cabecera: "Folio FOL-XXXX · Términos y condiciones", acción "Volver al resultado"
  - Estado de confirmación inline al aceptar: "Cotización finalizada · Folio FOL-XXXX"

#### Validación
- [ ] FE-15: Ejecutar `ng build` sin errores ni warnings de compilación
- [ ] FE-16: Verificar cobertura de `TermsService` ≥ 80% con `ng test --code-coverage`
- [ ] FE-17: Verificar cobertura de `TermsGuard` ≥ 80%
- [ ] FE-18: Verificar cobertura del método `CalculationService.obtenerResultado()` ≥ 80%

### Backend (Deuda técnica — documentada para el equipo backend)

- [ ] BE-01: Implementar `GET /v1/quotes/{folio}/calculation-result` — retorna el último `CalculationResult` para folios con `quoteStatus === 'CALCULATED'`
- [ ] BE-02: Implementar `POST /v1/quotes/{folio}/accept` — transiciona el folio de `CALCULATED` a `ISSUED`, registra `acceptedBy` y `acceptedAt`; respeta optimistic lock con `version`
- [ ] BE-03: Actualizar `api-contracts.md` con las dos nuevas rutas

### QA

- [ ] QA-01: Verificar guard: acceso directo con folio IN_PROGRESS → redirige a /calculation
- [ ] QA-02: Verificar resumen ejecutivo: primas MXN correctas, solo ubicaciones calculables listadas
- [ ] QA-03: Verificar formulario: botón deshabilitado en los 3 escenarios de campos incompletos
- [ ] QA-04: Verificar formulario: botón habilitado con ambos checkboxes + nombre ≥ 3 caracteres
- [ ] QA-05: Verificar aceptación exitosa: estado ISSUED en StatusBar + confirmación inline
- [ ] QA-06: Verificar error 409: mensaje visible, formulario editable
- [ ] QA-07: Verificar error 422: mensaje visible, formulario editable
- [ ] QA-08: Verificar "Descargar PDF": dispara window.print()
- [ ] QA-09: Verificar "Volver al resultado": navega a /quotes/:folio/calculation
- [ ] QA-10: Verificar "Volver al panel": visible solo tras accepted=true, navega a /cotizador
- [ ] QA-11: Ejecutar skill `/gherkin-case-generator` → criterios Gherkin completos
- [ ] QA-12: Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] QA-13: Actualizar estado spec: `status: IMPLEMENTED` al cerrar el feature
