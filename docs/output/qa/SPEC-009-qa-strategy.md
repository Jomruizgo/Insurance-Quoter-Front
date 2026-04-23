# Estrategia QA — SPEC-009: Cálculo de Prima (Paso 5/5)

**Fecha:** 2026-04-23
**Autor:** QA Lead (ASDD)
**Spec:** SPEC-009 `quote-calculation` — estado `IMPLEMENTED`
**Cobertura automatizada:** `calculation.service.spec.ts` (4/4 tests Jasmine + Karma)

---

## 1. Auditoría de Código vs. Criterios de Aceptación

### QA-01: Escenario feliz — 2 ubicaciones COMPLETE, Estado B visible con primas

**Criterio:** Al recibir respuesta 200, el Estado B (desglose financiero) se muestra y el trigger desaparece.

**Hallazgo:** APROBADO.
- `calculation.page.html` usa `@if (!result)` para Estado A y `@if (result)` para Estado B (líneas 2 y 34).
- `onCalculate()` en `calculation.page.ts` asigna `this.result = res` en el bloque `next` (línea 92).
- `PremiumSummaryComponent`, `PremiumBreakdownTableComponent` e `IncompleteLocationsAlertComponent` se renderizan condicionalmente dentro del bloque `@if (result)`.

**Archivo verificado:** `src/app/features/cotizador/pages/calculation/calculation.page.ts` líneas 91-95 y `calculation.page.html` líneas 2, 34.

---

### QA-02: Cálculo mixto — 1 COMPLETE + 1 INCOMPLETE, badge amarillo + alerta al pie

**Criterio:** Badge "N con alertas" en amarillo visible en Estado A; `IncompleteLocationsAlertComponent` visible en Estado B con el detalle de la ubicación incompleta.

**Hallazgo:** APROBADO.
- `calculation-trigger.component.html` muestra `<app-badge variant="warn">{{ incompleteCount }} con alertas</app-badge>` condicionalmente cuando `incompleteCount > 0` (línea 17).
- `incomplete-locations-alert.component.ts` expone `isVisible = incompleteLocations.length > 0` y el template renderiza con `@if (isVisible)`.
- `calculation.page.ts` calcula `incompleteLocations` filtrando `result.premiumsByLocation` donde `!p.calculable` (línea 48).

**Archivos verificados:** `calculation-trigger.component.html` línea 16-18, `incomplete-locations-alert.component.ts` línea 17, `calculation.page.ts` línea 47-49.

---

### QA-03: Error 422 — mensaje visible, Estado A permanece, botón habilitado

**Criterio:** Error 422 muestra mensaje específico, el Estado A (trigger) no se oculta, el botón queda habilitado para reintentar.

**Hallazgo:** APROBADO.
- `onCalculate()` captura el error y setea `this.error` con el mensaje correcto para status 422 (línea 100-101).
- `this.result` no se modifica en el bloque `error`, por lo que permanece `null` y el `@if (!result)` mantiene el Estado A visible.
- El template muestra `this.error` dentro del bloque `@if (!result)` (línea 18-21 del HTML), visible junto al trigger.
- `calculating` vuelve a `false` en el bloque `error` (línea 98), por lo que el botón se rehabilita.

**Texto del mensaje verificado:** `'No hay ubicaciones calculables. Completa al menos una ubicación antes de calcular.'` — coincide con la spec.

**Archivos verificados:** `calculation.page.ts` líneas 97-101, `calculation.page.html` líneas 2-31.

---

### QA-04: Error 409 — mensaje de conflicto visible, Estado A permanece

**Criterio:** Error 409 muestra mensaje de conflicto de versión; Estado A permanece visible.

**Hallazgo:** APROBADO.
- `onCalculate()` captura status 409 y setea `this.error = 'El folio fue modificado por otro usuario. Recarga la página para continuar.'` (líneas 102-104).
- Mismo mecanismo que QA-03: `this.result` no se modifica, Estado A permanece.

**Texto del mensaje verificado:** coincide exactamente con el criterio de la spec.

**Archivo verificado:** `calculation.page.ts` líneas 102-104.

---

### QA-05: "—" en celdas con valor 0 o null en tabla de desglose

**Criterio (RN-05):** Valores `0` o `null` en `coverageBreakdown` se muestran como `"—"` con color muted.

**Hallazgo:** APROBADO.
- `PremiumBreakdownTableComponent.getCellValue()` retorna `null` cuando el valor es `0` o `null` (líneas 26-30 del .ts).
- El template usa `@if (getCellValue(loc, comp.key); as val)` y en el `@else` renderiza `<span class="breakdown-table__muted">—</span>` (líneas 20-24 del .html).
- La misma lógica aplica a la columna "Total" con `getRowTotal()` (líneas 27-30 del .html).

**Observación de riesgo:** `getRowTotal()` suma los valores crudos del `coverageBreakdown` (incluyendo los `0`), por lo que si todas las ubicaciones tienen `0` en un componente, el total será `0` y se mostrará `"—"` en la celda total. Este comportamiento es correcto según RN-05. Sin embargo, si hay al menos una ubicación con valor positivo, el total se mostrará como número aunque otras celdas muestren `"—"`. Comportamiento consistente y esperado.

**Archivos verificados:** `premium-breakdown-table.component.ts` líneas 26-30, `premium-breakdown-table.component.html` líneas 20-30.

---

### QA-06: commercialPremium = netPremium × 1.16 (valor del backend)

**Criterio (RN-01):** El frontend SOLO muestra el valor que viene del backend; no recalcula.

**Hallazgo:** APROBADO. Sin defecto.
- Búsqueda en todos los archivos relevantes: ninguno contiene la expresión `* 1.16`, `netPremium * 1`, ni lógica de multiplicación para `commercialPremium`.
- `premium-summary.component.html` muestra directamente `result.commercialPremium` (línea 14).
- `CalculationResult` recibe `commercialPremium` como campo del backend y lo expone sin transformación.

**Archivos verificados:** `premium-summary.component.html` línea 14, `calculation.model.ts`, `calculation.service.ts`.

---

### QA-07: StatusBar refleja CALCULATED tras cálculo exitoso

**Criterio (RN-07):** Tras un cálculo exitoso se llama `QuoteStateService.refresh()`.

**Hallazgo:** APROBADO.
- `onCalculate()` llama `this.quoteStateService.refresh()` dentro del bloque `next`, después de asignar el resultado (línea 95).
- `QuoteStateService` está inyectado correctamente vía `inject()` (línea 35).

**Archivo verificado:** `calculation.page.ts` línea 95.

---

### QA-08: "Recalcular" vuelve a Estado A, limpia resultado

**Criterio (RN-09):** `onRecalculate()` vuelve al Estado A limpiando el resultado local; no llama automáticamente a la API.

**Hallazgo:** APROBADO.
- `onRecalculate()` setea `this.result = null` y `this.error = null` (líneas 112-115).
- No contiene ninguna llamada al service.
- El botón "Recalcular" en Estado B invoca `(click)="onRecalculate()"` (línea 43 del HTML).

**Archivo verificado:** `calculation.page.ts` líneas 112-115, `calculation.page.html` línea 43.

---

### QA-09: Navegación a /quotes/:folioNumber/terms-and-conditions

**Criterio:** Al hacer click en "Continuar", el router navega a `/quotes/:folioNumber/terms-and-conditions`.

**Hallazgo:** APROBADO.
- `onContinue()` invoca `this.router.navigate(['/quotes', this.folioNumber, 'terms-and-conditions'])` (líneas 117-119).
- La ruta `terms-and-conditions` existe registrada en `cotizador.routes.ts` línea 22.

**Archivo verificado:** `calculation.page.ts` líneas 117-119, `cotizador.routes.ts` línea 22.

---

### QA-10: Botón "Ejecutar cálculo" deshabilitado si calculableCount === 0

**Criterio (RN-04):** El botón se deshabilita cuando `calculableCount === 0` o `calculating === true`.

**Hallazgo:** APROBADO.
- `CalculationTriggerComponent.isDisabled` retorna `this.calculableCount === 0 || this.calculating` (líneas 20-22 del .ts).
- El template aplica `[disabled]="isDisabled"` al botón (línea 25 del .html).

**Archivo verificado:** `calculation-trigger.component.ts` líneas 20-22, `calculation-trigger.component.html` línea 25.

---

### DEFECTO ENCONTRADO — Botón "Descargar PDF" invoca onCalculate()

**Severidad:** Media
**Descripción:** En `calculation.page.html` línea 41, el botón "Descargar PDF" tiene `(click)="onCalculate()"`. Esto provoca que al hacer click en "Descargar PDF" se re-ejecute el cálculo de prima en lugar de generar el PDF.
**Ubicación:** `src/app/features/cotizador/pages/calculation/calculation.page.html` línea 41.
**Evidencia:**
```html
<app-btn variant="secondary" (click)="onCalculate()">
  Descargar PDF
</app-btn>
```
**Impacto:** El usuario que intente descargar el PDF re-disparará una llamada POST al backend, incrementando la versión del folio. Si la funcionalidad de PDF no está implementada, el botón debería estar deshabilitado o no renderizarse. No existe `onDownloadPdf()` en `calculation.page.ts`.
**Acción requerida:** Implementar `onDownloadPdf()` o deshabilitar/ocultar el botón hasta que la funcionalidad esté disponible. Este defecto no tiene issue QA asignado — se debe crear un issue nuevo.

---

### OBSERVACIÓN — Ruta registrada como "calculation" (discrepancia con spec)

La spec (sección 2.4) define la ruta como `/quotes/:folio/technical-info`, pero en `cotizador.routes.ts` está registrada como `calculation` (línea 21). Esto es correcto en la implementación porque `technical-info` ya está ocupada por `TechnicalInfoPage` (coberturas, paso 4). La discrepancia es de la spec, no del código. La ruta real funcional es `/quotes/:folioNumber/calculation`.

---

### OBSERVACIÓN — Botón "Continuar" habilitado en Estado B sin verificar quoteStatus

**Severidad:** Baja (comportamiento aceptable en flujo normal)
**Descripción:** La spec define (RN-06) que "Continuar" solo se habilita cuando `quoteStatus === 'CALCULATED'`. En Estado A, el botón está `[disabled]="true"` hardcodeado. En Estado B, el botón no verifica `quoteStatus` — se asume habilitado siempre que `result !== null`. En la práctica, si `result !== null` el `quoteStatus` necesariamente es `'CALCULATED'` según el modelo `CalculationResult`. El riesgo es bajo pero conviene documentarlo.

---

## 2. Cobertura de Tests Automatizados

### 2.1 Cubierto por calculation.service.spec.ts (Jasmine + Karma)

| # | Escenario | Test | Estado |
|---|-----------|------|--------|
| 1 | POST a URL correcta con body `{ version }` | `should POST to correct URL with version body and return CalculationResult on 200` | PASS |
| 2 | Respuesta 200 retorna `CalculationResult` con `quoteStatus: CALCULATED` | `should return CalculationResult with quoteStatus CALCULATED on success` | PASS |
| 3 | Error 409 propaga `HttpErrorResponse` con `code: VERSION_CONFLICT` | `should propagate HttpErrorResponse 409 when calculate() receives VERSION_CONFLICT` | PASS |
| 4 | Error 422 propaga `HttpErrorResponse` con `code: NO_CALCULABLE_LOCATIONS` | `should propagate HttpErrorResponse 422 when calculate() receives NO_CALCULABLE_LOCATIONS` | PASS |

**Cobertura estimada del CalculationService:** 100% de ramas (el service tiene una sola función de una línea; todos los caminos de éxito y error están cubiertos por los 4 tests).

### 2.2 NO cubierto por tests unitarios (requiere prueba manual o E2E)

Los siguientes criterios son de lógica de componente/template y no se testean con Jasmine según las reglas del proyecto:

| Criterio | Motivo de exclusión | Nivel de prueba recomendado |
|----------|---------------------|-----------------------------|
| QA-01: Estado B visible tras 200 | Lógica de template/componente | Manual + E2E Serenity |
| QA-02: Badge amarillo visible con incompletas | Binding de template | Manual + E2E Serenity |
| QA-03/04: Mensaje de error visible, Estado A permanece | Estado de componente | Manual + E2E Serenity |
| QA-05: "—" en celdas cero/null | Lógica de template con pipe | Manual |
| QA-06: No recálculo de commercialPremium | Revisión de código (hecha) | Manual (verificar en pantalla) |
| QA-07: StatusBar refresh | Interacción entre servicios | E2E Serenity |
| QA-08: Recalcular limpia resultado | Estado de componente | Manual + E2E Serenity |
| QA-09: Navegación correcta | Router Angular | Manual + E2E Serenity |
| QA-10: Botón deshabilitado con 0 calculables | Binding de template | Manual |

---

## 3. Casos de Prueba Manual

| ID | Precondición | Pasos | Resultado esperado | Estado |
|----|--------------|-------|--------------------|--------|
| TC-01 | Folio con 2 ubicaciones COMPLETE, v7 | 1. Navegar a `/quotes/FOL-2026-00042/calculation` 2. Verificar Estado A 3. Click "Ejecutar cálculo" | Badge "2 calculables" verde. Estado B con 3 cards (Prima neta MXN 48,500.00, Prima comercial MXN 56,260.00, lista por ubicación). StatusBar muestra CALCULATED. | PENDIENTE |
| TC-02 | Folio con 1 COMPLETE + 1 INCOMPLETE | 1. Navegar a la pantalla de cálculo 2. Verificar badges en Estado A 3. Ejecutar cálculo 4. Verificar Estado B | Badge verde "1 calculables" + badge amarillo "1 con alertas". En Estado B, alerta al pie lista "Oficina Sur: Código postal requerido". | PENDIENTE |
| TC-03 | Backend configurado para responder 422 | 1. Configurar stub de backend con 422 2. Click "Ejecutar cálculo" | Mensaje "No hay ubicaciones calculables..." visible. Estado A permanece. Botón habilitado. | PENDIENTE |
| TC-04 | Backend configurado para responder 409 | 1. Configurar stub de backend con 409 2. Click "Ejecutar cálculo" | Mensaje "El folio fue modificado por otro usuario..." visible. Estado A permanece. | PENDIENTE |
| TC-05 | Folio con 1 COMPLETE con varios componentes en 0 | 1. Ejecutar cálculo 2. Revisar tabla de desglose | Componentes con valor 0 muestran "—" en color muted. Fila "Prima neta por ubicación" en bold con total correcto. | PENDIENTE |
| TC-06 | Estado B visible | 1. Verificar card "Prima comercial" 2. Calcular manualmente netPremium × 1.16 | El valor en pantalla coincide con el retornado por el backend; no hay diferencia por redondeo. | PENDIENTE |
| TC-07 | Estado B visible | 1. Click "Recalcular" | Pantalla vuelve a Estado A. Contadores de ubicaciones actualizados. No se realiza llamada HTTP automática. | PENDIENTE |
| TC-08 | Estado B visible | 1. Click "Continuar a términos y condiciones" | Router navega a `/quotes/FOL-2026-00042/terms-and-conditions`. | PENDIENTE |
| TC-09 | Folio con 0 ubicaciones COMPLETE | 1. Navegar a pantalla de cálculo | Botón "Ejecutar cálculo" deshabilitado visualmente. | PENDIENTE |
| TC-10 | DEFECTO: Botón "Descargar PDF" | 1. En Estado B, click "Descargar PDF" | DEFECTO CONFIRMADO: Dispara llamada POST /calculate en lugar de generar PDF. | FALLA |

---

## 4. Casos de Prueba E2E Propuestos (Auto_Front_Screenplay — Serenity BDD)

### Flujo 1: Cálculo exitoso con todas las ubicaciones completas (SMOKE)

```gherkin
Feature: Cálculo de prima — Flujo feliz

  @smoke
  Scenario: El agente ejecuta el cálculo con 2 ubicaciones COMPLETE y ve el desglose
    Given el agente está en la pantalla de cálculo del folio "FOL-2026-00042"
    And el folio tiene 2 ubicaciones con validationStatus "COMPLETE"
    When el agente hace click en el botón "Ejecutar cálculo"
    Then el badge "2 calculables" es visible en verde
    And la pantalla muestra el Estado B con:
      | Prima neta     | MXN 48,500.00 |
      | Prima comercial| MXN 56,260.00 |
    And el StatusBar muestra el estado "CALCULATED"
```

**Screenplay Tasks:**
- `NavegarAPantallaDeCálculo(folioNumber)`
- `HacerClickEnEjecutarCálculo()`
- `VerificarEstadoB(netPremium, commercialPremium)`
- `VerificarStatusBar("CALCULATED")`

---

### Flujo 2: Cálculo mixto con ubicación incompleta (REGRESSION)

```gherkin
  @regression
  Scenario: El agente ve la alerta de ubicaciones incompletas al calcular con mixto
    Given el folio "FOL-2026-00043" tiene 1 ubicación COMPLETE y 1 INCOMPLETE
    When el agente ejecuta el cálculo desde la pantalla /quotes/FOL-2026-00043/calculation
    Then el badge "1 con alertas" es visible en amarillo en Estado A antes del cálculo
    And tras el cálculo el IncompleteLocationsAlertComponent muestra "Oficina Sur: Código postal requerido"
```

---

### Flujo 3: Manejo de error 422 — sin ubicaciones calculables (REGRESSION)

```gherkin
  @regression
  Scenario: El agente recibe error 422 y puede reintentar
    Given el backend retorna 422 con code "NO_CALCULABLE_LOCATIONS"
    When el agente hace click en "Ejecutar cálculo"
    Then el mensaje "No hay ubicaciones calculables. Completa al menos una ubicación antes de calcular." es visible
    And el Estado A (CalculationTriggerComponent) sigue visible
    And el botón "Ejecutar cálculo" está habilitado
```

---

### Flujo 4: Recalcular desde Estado B (REGRESSION)

```gherkin
  @regression
  Scenario: El agente recalcula desde Estado B y vuelve a Estado A
    Given el Estado B está visible con resultado de cálculo previo
    When el agente hace click en "Recalcular"
    Then la pantalla muestra el Estado A (CalculationTriggerComponent)
    And no se realiza ninguna llamada HTTP al backend
```

---

### Flujo 5: Navegación a términos y condiciones (SMOKE)

```gherkin
  @smoke
  Scenario: El agente continúa a términos y condiciones tras cálculo exitoso
    Given el Estado B está visible con quoteStatus "CALCULATED"
    When el agente hace click en "Continuar a términos y condiciones"
    Then el navegador muestra la URL "/quotes/FOL-2026-00042/terms-and-conditions"
```

---

### Estructura de clases Screenplay recomendada

```
Auto_Front_Screenplay/
└── src/test/java/com/sofka/iq/
    ├── features/
    │   └── calculation/
    │       ├── CalculationFlowTest.java          (JUnit 5 + Serenity runner)
    │       └── CalculationMixedFlowTest.java
    ├── tasks/
    │   ├── NavegarAPantallaDeCálculo.java
    │   ├── EjecutarCálculo.java
    │   └── VerificarAlertaUbicacionesIncompletas.java
    ├── questions/
    │   ├── EstadoBEsVisible.java
    │   ├── PrimaNetaVisible.java
    │   └── StatusBarMuestraEstado.java
    └── ui/
        └── CalculationPageUi.java               (targets CSS/data-testid)
```

**Recomendación:** Agregar atributos `data-testid` a los elementos clave del template para facilitar la localización en Serenity:
- `data-testid="btn-ejecutar-calculo"`
- `data-testid="badge-calculables"`
- `data-testid="badge-alertas"`
- `data-testid="card-prima-neta"`
- `data-testid="card-prima-comercial"`
- `data-testid="incomplete-locations-alert"`
- `data-testid="btn-recalcular"`
- `data-testid="btn-continuar"`

---

## 5. Riesgos Residuales

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|-------------|---------|------------|
| R-01 | **Botón "Descargar PDF" dispara cálculo** (DEFECTO CONFIRMADO) | Alta | Media | Corregir `(click)="onCalculate()"` → `onDownloadPdf()` antes de release. Issue pendiente de creación. |
| R-02 | `version` inicializada en `0` si `QuoteStateService.obtenerEstado()` falla | Media | Alta | El POST se enviará con `version: 0`, causando 409 si el backend tiene versión > 0. El error se muestra al usuario (manejado), pero no se recupera automáticamente. Requiere prueba con backend real. |
| R-03 | `loadSummary()` usa `LocationService.obtenerResumen()` que puede fallar silenciosamente, dejando `calculableCount = 0` | Media | Alta | Con `calculableCount = 0`, el botón "Ejecutar cálculo" queda deshabilitado aunque haya ubicaciones completas. Requiere prueba de integración con backend. |
| R-04 | `getRowTotal()` no usa `getCellValue()`, suma valores `0` directamente del breakdown | Baja | Baja | El total de fila podría mostrar `0` en lugar de `"—"` cuando todos los componentes son `0`. Verificar en pantalla con datos reales. |
| R-05 | La ruta `calculation` difiere de la spec que indica `technical-info` | Baja | Media | La discrepancia está en la spec (error documental). La ruta `calculation` es correcta para evitar conflicto con `TechnicalInfoPage`. Actualizar spec para reflejar la ruta real. |
| R-06 | `IncompleteLocationsAlertComponent` no tiene `role="alert"` con tipo "warn" explícito en clase CSS | Baja | Baja | La spec indica `tipo "warn"` pero el componente usa clase `incomplete-alert` sin variante. Verificar que el diseño visual corresponde a una alerta de advertencia. |
| R-07 | Botón "Continuar" en Estado B no verifica `quoteStatus` explícitamente | Baja | Baja | En flujo normal no es problema (si hay `result`, el status es CALCULATED). Riesgo si en el futuro se permite cargar un resultado previo sin recalcular. |

---

## 6. Resumen de Auditoría

| Issue | QA | Resultado | Evidencia |
|-------|----|-----------|-----------|
| #185 | QA-01 | APROBADO | `calculation.page.ts:92`, `calculation.page.html:2,34` |
| #186 | QA-02 | APROBADO | `calculation-trigger.component.html:16-18`, `incomplete-locations-alert.component.ts:17` |
| #187 | QA-03 | APROBADO | `calculation.page.ts:97-101`, `calculation.page.html:18-21` |
| #188 | QA-04 | APROBADO | `calculation.page.ts:102-104` |
| #189 | QA-05 | APROBADO | `premium-breakdown-table.component.ts:26-30`, `.html:20-24` |
| #190 | QA-06 | APROBADO | `premium-summary.component.html:14` — sin recálculo frontend |
| #191 | QA-07 | APROBADO | `calculation.page.ts:95` |
| #192 | QA-08 | APROBADO | `calculation.page.ts:112-115`, `calculation.page.html:43` |
| #193 | QA-09 | APROBADO | `calculation.page.ts:117-119`, `cotizador.routes.ts:22` |
| #194 | QA-10 | APROBADO | `calculation-trigger.component.ts:20-22`, `.html:25` |
| — | DEFECTO | PDF FALLA | `calculation.page.html:41` — `onCalculate()` en lugar de `onDownloadPdf()` |

**10 de 10 criterios QA aprobados en auditoría de código.**
**1 defecto encontrado fuera del alcance de los issues asignados** (botón PDF) — requiere issue nuevo.
**3 riesgos de integración** (R-02, R-03) requieren validación con backend real antes de release.
