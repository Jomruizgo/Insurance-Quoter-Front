# Escenarios Gherkin — Términos y Condiciones del Folio (SPEC-010)

**Skill:** `/gherkin-case-generator`
**Feature:** `quote-terms-and-conditions`
**Generado:** 2026-04-23
**QA Lead:** ASDD

---

## Índice

- [Background](#background)
- [HU-01 — Revisar el resumen ejecutivo](#hu-01--revisar-el-resumen-ejecutivo)
- [HU-02 — Leer y aceptar los términos y condiciones](#hu-02--leer-y-aceptar-los-términos-y-condiciones)
- [HU-03 — Finalizar el folio y obtener confirmación](#hu-03--finalizar-el-folio-y-obtener-confirmación)
- [Escenarios de Borde Adicionales](#escenarios-de-borde-adicionales)
- [Mapa de Flujos Críticos](#mapa-de-flujos-críticos)
- [Datos de Prueba](#datos-de-prueba)
- [Tabla de Priorización para Serenity BDD](#tabla-de-priorización-para-serenity-bdd)

---

## Background

```gherkin
Feature: Términos y condiciones del folio
  Como agente de cotización
  Quiero revisar el resumen ejecutivo, aceptar los términos y condiciones y finalizar el folio
  Para emitir oficialmente la cotización de seguro de daños

  Background:
    Given el agente está autenticado en el sistema
    And existe el folio "FOL-2026-00042" con version 8 y quoteStatus "CALCULATED"
    And el cálculo retornó netPremium 48500.00 y commercialPremium 56260.00
    And el folio tiene cliente "Empresa ABC S.A. de C.V.", suscriptor "SUB-001", agente "AGT-007"
    And el folio tiene 2 ubicaciones: "Bodega Principal" (calculable=true) y "Oficina Anexa" (calculable=false)
    And la fecha de cálculo es "2026-04-23T16:00:00Z"
```

---

## HU-01 — Revisar el resumen ejecutivo

### SPEC-010-TC-001 — Acceso permitido con folio CALCULATED [P1]

```gherkin
  @P1 @smoke @guard @HU-01
  Scenario: Acceso permitido con folio CALCULATED
    # Verifica la regla de negocio RN-01: guard permite acceso solo con CALCULATED
    When el agente navega a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then la pantalla se muestra correctamente con el resumen ejecutivo
    And la cabecera muestra el texto "Folio FOL-2026-00042 · Términos y condiciones"
    And el enlace "Volver al resultado" es visible en la cabecera
```

### SPEC-010-TC-002 — Acceso denegado si quoteStatus es IN_PROGRESS [P1]

```gherkin
  @P1 @smoke @guard @HU-01
  Scenario: Acceso denegado si quoteStatus es IN_PROGRESS
    # Verifica RN-01: cualquier estado distinto de CALCULATED → redirección
    Given el folio "FOL-2026-00042" tiene quoteStatus "IN_PROGRESS"
    When el agente navega directamente a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then el router redirige automáticamente a "/quotes/FOL-2026-00042/calculation"
    And la pantalla de términos y condiciones no se muestra
```

### SPEC-010-TC-003 — Acceso denegado si quoteStatus es CREATED [P1]

```gherkin
  @P1 @guard @HU-01
  Scenario: Acceso denegado si quoteStatus es CREATED
    Given el folio "FOL-2026-00042" tiene quoteStatus "CREATED"
    When el agente navega directamente a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then el router redirige automáticamente a "/quotes/FOL-2026-00042/calculation"
```

### SPEC-010-TC-004 — Acceso denegado si quoteStatus es ISSUED [P1]

```gherkin
  @P1 @guard @edge @HU-01
  Scenario: Acceso denegado si quoteStatus es ISSUED (folio ya emitido)
    # Caso crítico: el agente intenta re-emitir un folio ya aceptado
    Given el folio "FOL-2026-00042" tiene quoteStatus "ISSUED"
    When el agente navega directamente a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then el router redirige automáticamente a "/quotes/FOL-2026-00042/calculation"
    And no se permite completar un segundo proceso de aceptación
```

### SPEC-010-TC-005 — Visualización del QuoteSummaryCard con datos completos [P1]

```gherkin
  @P1 @smoke @HU-01
  Scenario: Visualizar QuoteSummaryCardComponent con datos correctos
    # Verifica que el resumen ejecutivo muestre todos los campos del background
    When el agente navega a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then el QuoteSummaryCardComponent muestra los siguientes datos:
      | campo                  | valor                    |
      | Folio                  | FOL-2026-00042           |
      | Cliente                | Empresa ABC S.A. de C.V. |
      | Suscriptor             | SUB-001                  |
      | Agente                 | AGT-007                  |
      | Número de ubicaciones  | 2                        |
      | Fecha de cálculo       | 23 Abr 2026 16:00        |
      | Prima neta total       | MXN 48,500.00            |
      | Prima comercial total  | MXN 56,260.00            |
      | Badge de estado        | CALCULADA                |
    And el badge tiene variante "brand"
```

### SPEC-010-TC-006 — Lista de ubicaciones muestra solo calculables [P1]

```gherkin
  @P1 @HU-01
  Scenario: Lista de ubicaciones solo muestra las calculables
    # Verifica RN-03: solo ubicaciones con calculable=true aparecen en el resumen
    When el agente navega a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then el QuoteSummaryCardComponent lista únicamente la ubicación "Bodega Principal"
    And "Bodega Principal" muestra netPremium "MXN 48,500.00"
    And la ubicación "Oficina Anexa" no aparece en la lista de ubicaciones
```

### SPEC-010-TC-007 — Acceso directo por URL sin router state [P2]

```gherkin
  @P2 @HU-01
  Scenario: Carga del CalculationResult por GET cuando no hay router state
    # Verifica la estrategia Caso B: acceso directo por URL (§ 2.8)
    Given el agente accede directamente a la URL sin haber navegado desde CalculationPage
    And el endpoint "GET /v1/quotes/FOL-2026-00042/calculation-result" retorna 200 con los datos de cálculo
    When la TermsPage inicializa
    Then se realiza una petición GET a "/v1/quotes/FOL-2026-00042/calculation-result"
    And el QuoteSummaryCardComponent se renderiza con los datos recibidos
```

### SPEC-010-TC-008 — Error al cargar CalculationResult por GET (404) [P2]

```gherkin
  @P2 @error @HU-01
  Scenario: Error 404 al cargar resultado de cálculo por acceso directo
    Given el agente accede directamente a la URL sin router state
    And el endpoint "GET /v1/quotes/FOL-2026-00042/calculation-result" retorna 404
    When la TermsPage inicializa
    Then se muestra un mensaje de error indicando que el resultado no está disponible
    And se ofrece al agente navegar de vuelta a "/quotes/FOL-2026-00042/calculation"
```

---

## HU-02 — Leer y aceptar los términos y condiciones

### SPEC-010-TC-009 — Bloque de términos tiene scroll y cinco secciones [P2]

```gherkin
  @P2 @HU-02
  Scenario: Bloque de términos y condiciones es scrollable y contiene las cinco secciones
    # Verifica que TermsAndConditionsTextComponent tiene altura máxima de 320px
    When el agente navega a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then el TermsAndConditionsTextComponent tiene un contenedor con max-height de 320px
    And el contenedor tiene overflow-y en modo auto o scroll
    And el bloque contiene la sección "Veracidad de la información"
    And el bloque contiene la sección "Vigencia y validez de la cotización"
    And el bloque contiene la sección "Condiciones para la emisión de la póliza"
    And el bloque contiene la sección "Tratamiento de datos personales (LFPDPPP)"
    And el bloque contiene la sección "Limitaciones de cobertura"
```

### SPEC-010-TC-010 — Botón deshabilitado con todos los campos vacíos [P1]

```gherkin
  @P1 @smoke @HU-02
  Scenario: Botón deshabilitado con checkboxes desmarcados y nombre vacío
    When el agente navega a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then el AcceptanceFormComponent muestra ambos checkboxes desmarcados
    And el campo "Nombre del aceptante" está vacío
    And el botón "Aceptar y finalizar cotización" está deshabilitado
```

### SPEC-010-TC-011 — Botón deshabilitado con solo primer checkbox marcado [P1]

```gherkin
  @P1 @HU-02
  Scenario: Botón deshabilitado con solo el primer checkbox marcado y nombre completo
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    When el agente marca el checkbox "He leído y acepto los términos y condiciones"
    And el agente deja sin marcar "Declaro que la información proporcionada es verídica y completa"
    And el agente escribe "Juan Pérez" en el campo "Nombre del aceptante"
    Then el botón "Aceptar y finalizar cotización" está deshabilitado
```

### SPEC-010-TC-012 — Botón deshabilitado con solo segundo checkbox marcado [P1]

```gherkin
  @P1 @HU-02
  Scenario: Botón deshabilitado con solo el segundo checkbox marcado y nombre completo
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    When el agente deja sin marcar "He leído y acepto los términos y condiciones"
    And el agente marca el checkbox "Declaro que la información proporcionada es verídica y completa"
    And el agente escribe "Juan Pérez" en el campo "Nombre del aceptante"
    Then el botón "Aceptar y finalizar cotización" está deshabilitado
```

### SPEC-010-TC-013 — Botón deshabilitado con ambos checkboxes marcados y nombre vacío [P1]

```gherkin
  @P1 @HU-02
  Scenario: Botón deshabilitado cuando ambos checkboxes están marcados pero el nombre está vacío
    # Verifica RN-02: acceptedBy debe tener mínimo 3 caracteres
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    When el agente marca el checkbox "He leído y acepto los términos y condiciones"
    And el agente marca el checkbox "Declaro que la información proporcionada es verídica y completa"
    And el campo "Nombre del aceptante" está vacío
    Then el botón "Aceptar y finalizar cotización" está deshabilitado
```

### SPEC-010-TC-014 — Botón habilitado con formulario completamente válido [P1]

```gherkin
  @P1 @smoke @HU-02
  Scenario: Botón habilitado con ambos checkboxes marcados y nombre válido
    # Verifica RN-02: condición completa de habilitación del botón
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    When el agente marca el checkbox "He leído y acepto los términos y condiciones"
    And el agente marca el checkbox "Declaro que la información proporcionada es verídica y completa"
    And el agente escribe "Juan Pérez López" en el campo "Nombre del aceptante"
    Then el botón "Aceptar y finalizar cotización" está habilitado
```

### SPEC-010-TC-015 — Vigencia de la cotización visible en la barra de finalización [P2]

```gherkin
  @P2 @HU-02
  Scenario: Barra de finalización muestra la fecha de cálculo y vigencia
    # Verifica RN-04: vigencia de 30 días desde calculatedAt
    When el agente navega a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then la barra inferior QuoteFinalizationBarComponent muestra "Cotización calculada el 23 Abr 2026 16:00"
    And el botón "Descargar PDF" es visible
    And el botón "Aceptar y finalizar cotización" refleja el estado actual del formulario
```

---

## HU-03 — Finalizar el folio y obtener confirmación

### SPEC-010-TC-016 — Aceptación exitosa con transición a ISSUED [P1]

```gherkin
  @P1 @smoke @HU-03
  Scenario: Aceptación exitosa del folio — transición de CALCULATED a ISSUED
    # Verifica el flujo principal completo incluyendo RN-06 y RN-08
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    And el agente ha marcado ambos checkboxes
    And el agente ha escrito "Juan Pérez López" en el campo "Nombre del aceptante"
    And el formulario de aceptación está completamente válido
    When el agente hace click en el botón "Aceptar y finalizar cotización"
    Then se muestra el spinner de progreso durante la petición
    And el sistema envía POST a "/v1/quotes/FOL-2026-00042/accept" con el body:
      | campo      | valor            |
      | acceptedBy | Juan Pérez López |
      | version    | 8                |
    And al recibir respuesta 200 se muestra el mensaje "Cotización finalizada · Folio FOL-2026-00042"
    And el StatusBar actualiza el estado a "ISSUED"
    And el formulario de aceptación queda deshabilitado
    And el botón "Volver al panel" es visible
    And el botón "Volver al panel" navega a "/cotizador" al hacer click
```

### SPEC-010-TC-017 — Error 409 por conflicto de versión [P1]

```gherkin
  @P1 @error @HU-03
  Scenario: Error 409 — conflicto de versión optimista al aceptar
    # Verifica manejo del error de concurrencia (versión obsoleta)
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions" con el formulario válido
    And el backend retornará 409 con body '{"error":"Optimistic lock conflict","code":"VERSION_CONFLICT"}'
    When el agente hace click en el botón "Aceptar y finalizar cotización"
    Then se muestra el mensaje de error:
      "El folio fue modificado por otro usuario. Recarga la página para continuar."
    And el formulario de aceptación permanece editable
    And el botón "Aceptar y finalizar cotización" vuelve a estar habilitado para reintentar
    And el estado del formulario (checkboxes y nombre) no se borra
```

### SPEC-010-TC-018 — Error 422 por estado de folio inválido [P1]

```gherkin
  @P1 @error @HU-03
  Scenario: Error 422 — el folio no está en estado CALCULATED al momento de aceptar
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions" con el formulario válido
    And el backend retornará 422 con body '{"error":"Cannot transition to ISSUED","code":"INVALID_STATUS_TRANSITION"}'
    When el agente hace click en el botón "Aceptar y finalizar cotización"
    Then se muestra el mensaje de error:
      "No se puede finalizar el folio. Verifica que el cálculo esté vigente."
    And el formulario de aceptación permanece editable
```

### SPEC-010-TC-019 — Botón Descargar PDF dispara window.print() [P2]

```gherkin
  @P2 @HU-03
  Scenario: Botón Descargar PDF ejecuta la impresión del navegador
    # Verifica RN-07: window.print() como mecanismo de PDF en esta fase
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    When el agente hace click en el botón "Descargar PDF"
    Then se invoca window.print() en el navegador
```

### SPEC-010-TC-020 — Navegación de regreso al resultado desde la cabecera [P2]

```gherkin
  @P2 @navigation @HU-03
  Scenario: Volver al resultado desde la cabecera
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    When el agente hace click en "Volver al resultado"
    Then el router navega a "/quotes/FOL-2026-00042/calculation"
```

### SPEC-010-TC-021 — Botón Volver al panel no visible antes de aceptación [P2]

```gherkin
  @P2 @HU-03
  Scenario: Botón "Volver al panel" no es visible antes de completar la aceptación
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    And el agente aún no ha aceptado el folio
    Then el botón "Volver al panel" no es visible en la pantalla
```

---

## Escenarios de Borde Adicionales

### SPEC-010-TC-022 — Nombre con solo espacios en blanco deshabilita el botón [P1]

```gherkin
  @P1 @edge @boundary
  Scenario: Nombre con solo espacios en blanco — botón deshabilitado
    # Verifica RN-02: "al menos 3 caracteres sin espacios iniciales/finales"
    # El trim() debe aplicarse antes de validar el minLength
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    And el agente ha marcado ambos checkboxes
    When el agente escribe "   " (tres espacios) en el campo "Nombre del aceptante"
    Then el botón "Aceptar y finalizar cotización" está deshabilitado
    # Datos de prueba adicionales:
    # | entrada     | longitud_real_trimmed | resultado_botón |
    # | " "         | 0                     | deshabilitado   |
    # | "  "        | 0                     | deshabilitado   |
    # | "   "       | 0                     | deshabilitado   |
    # | "    "      | 0                     | deshabilitado   |
```

### SPEC-010-TC-023 — Nombre con exactamente 2 caracteres deshabilita el botón [P1]

```gherkin
  @P1 @edge @boundary
  Scenario: Nombre con exactamente 2 caracteres — no alcanza el minLength 3
    # Verifica el límite inferior de RN-02: minLength estricto = 3
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    And el agente ha marcado ambos checkboxes
    When el agente escribe "Jo" en el campo "Nombre del aceptante"
    Then el botón "Aceptar y finalizar cotización" está deshabilitado
```

### SPEC-010-TC-024 — Nombre con exactamente 3 caracteres habilita el botón [P1]

```gherkin
  @P1 @edge @boundary
  Scenario: Nombre con exactamente 3 caracteres — cumple el minLength 3
    # Verifica el límite mínimo exacto de RN-02
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    And el agente ha marcado ambos checkboxes
    When el agente escribe "Ana" en el campo "Nombre del aceptante"
    Then el botón "Aceptar y finalizar cotización" está habilitado
```

### SPEC-010-TC-025 — Folio con quoteStatus ISSUED redirige al intentar acceder [P1]

```gherkin
  @P1 @edge @guard
  Scenario: Folio ya emitido (ISSUED) — guard impide re-aceptación
    # Caso de borde: el agente intenta volver a la pantalla después de haber aceptado
    # Importante: ISSUED no es un estado válido para mostrar el formulario
    Given existe el folio "FOL-2026-00042" con quoteStatus "ISSUED"
    When el agente intenta navegar a "/quotes/FOL-2026-00042/terms-and-conditions"
    Then el TermsGuard detecta que el estado no es "CALCULATED"
    And el router redirige automáticamente a "/quotes/FOL-2026-00042/calculation"
    And el agente no puede ver ni interactuar con el formulario de aceptación
```

### SPEC-010-TC-026 — Error de red al aceptar muestra mensaje genérico [P1]

```gherkin
  @P1 @edge @error
  Scenario: Error de red al hacer click en Aceptar — mensaje genérico de error
    # Cubre el caso de falla de conectividad no contemplado en los errores 409/422
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions" con el formulario válido
    And la red no está disponible o el servidor retorna un error 500 o 0 (timeout)
    When el agente hace click en el botón "Aceptar y finalizar cotización"
    Then se oculta el spinner de progreso
    And se muestra un mensaje de error genérico visible al agente
    And el formulario de aceptación permanece editable para reintentar
    And el botón "Aceptar y finalizar cotización" vuelve a estar habilitado
```

### SPEC-010-TC-027 — Nombre con 2 caracteres más espacios (trim boundary) [P2]

```gherkin
  @P2 @edge @boundary
  Scenario: Nombre "  Jo  " con espacios — el trim deja 2 caracteres, botón deshabilitado
    Given el agente está en "/quotes/FOL-2026-00042/terms-and-conditions"
    And el agente ha marcado ambos checkboxes
    When el agente escribe "  Jo  " en el campo "Nombre del aceptante"
    Then el botón "Aceptar y finalizar cotización" está deshabilitado
```

### SPEC-010-TC-028 — Formulario permanece deshabilitado tras aceptación exitosa [P2]

```gherkin
  @P2 @edge @HU-03
  Scenario: Formulario queda bloqueado permanentemente tras aceptación exitosa en la sesión
    # Verifica RN-08: el estado de confirmación es permanente en la sesión
    Given el agente ha completado exitosamente la aceptación del folio "FOL-2026-00042"
    And el mensaje "Cotización finalizada · Folio FOL-2026-00042" es visible
    When el agente intenta interactuar con los checkboxes o el campo de nombre
    Then los campos del formulario están deshabilitados y no aceptan modificaciones
    And el botón "Aceptar y finalizar cotización" permanece deshabilitado
```

---

## Mapa de Flujos Críticos

Los siguientes flujos representan los caminos de mayor riesgo de negocio y técnico para la automatización E2E con Serenity BDD:

### Flujo Crítico FC-01 — Aceptación exitosa completa (happy path)

```
Navegación a T&C
  → Guard valida CALCULATED
    → Carga paralela (CalculationResult + GeneralInfo)
      → Resumen ejecutivo visible
        → Agente completa formulario (2 checkboxes + nombre ≥ 3 chars)
          → Click "Aceptar y finalizar cotización"
            → POST /v1/quotes/{folio}/accept → 200
              → Estado ISSUED en StatusBar
                → Confirmación inline visible
                  → Formulario bloqueado
                    → Botón "Volver al panel" habilitado
```

Escenarios cubiertos: TC-001, TC-005, TC-006, TC-014, TC-016, TC-021

### Flujo Crítico FC-02 — Guard de acceso (bloqueo por estado inválido)

```
Intento de acceso con quoteStatus ≠ CALCULATED
  → Guard obtiene estado del QuoteStateService
    → Estado no es CALCULATED
      → Redirección a /calculation
```

Escenarios cubiertos: TC-002, TC-003, TC-004, TC-025

### Flujo Crítico FC-03 — Validación del formulario de aceptación (boundary)

```
Pantalla visible con formulario vacío
  → Botón deshabilitado
    → Marcado de 1 checkbox → sigue deshabilitado
      → Marcado de 2 checkboxes → sigue deshabilitado (sin nombre)
        → Nombre con 2 chars → sigue deshabilitado
          → Nombre con 3 chars → botón HABILITADO
            → Nombre con espacios → botón deshabilitado
```

Escenarios cubiertos: TC-010, TC-011, TC-012, TC-013, TC-022, TC-023, TC-024, TC-027

### Flujo Crítico FC-04 — Manejo de errores de backend al aceptar

```
Formulario válido → Click "Aceptar"
  → Spinner visible
    → Respuesta 409 → mensaje VERSION_CONFLICT → formulario editable
    → Respuesta 422 → mensaje INVALID_STATUS_TRANSITION → formulario editable
    → Error de red/500 → mensaje genérico → formulario editable
```

Escenarios cubiertos: TC-017, TC-018, TC-026

---

## Datos de Prueba

### Dataset A — Folio principal (estado CALCULATED)

| Campo | Valor |
|-------|-------|
| folioNumber | FOL-2026-00042 |
| quoteStatus | CALCULATED |
| version | 8 |
| netPremium | 48500.00 |
| commercialPremium | 56260.00 |
| cliente | Empresa ABC S.A. de C.V. |
| suscriptor | SUB-001 |
| agente | AGT-007 |
| calculatedAt | 2026-04-23T16:00:00Z |
| calculatedAt formateado | 23 Abr 2026 16:00 |
| ubicación calculable | Bodega Principal (calculable=true, netPremium=48500.00) |
| ubicación no calculable | Oficina Anexa (calculable=false) |

### Dataset B — Folio ya emitido

| Campo | Valor |
|-------|-------|
| folioNumber | FOL-2026-00042 |
| quoteStatus | ISSUED |
| version | 9 |
| acceptedBy | Juan Pérez López |
| acceptedAt | 2026-04-23T18:30:00Z |

### Dataset C — Folios en estados intermedios (para guard)

| folioNumber | quoteStatus | Resultado esperado |
|-------------|-------------|-------------------|
| FOL-2026-00042 | CREATED | Redirige a /calculation |
| FOL-2026-00042 | IN_PROGRESS | Redirige a /calculation |
| FOL-2026-00042 | CALCULATED | Permite acceso |
| FOL-2026-00042 | ISSUED | Redirige a /calculation |

### Dataset D — Datos del formulario de aceptación (boundary values)

| Caso | acceptedBy | termsAccepted | truthDeclaration | Botón |
|------|------------|---------------|-----------------|-------|
| Todos vacíos | "" | false | false | Deshabilitado |
| Solo primer checkbox | "Juan Pérez" | true | false | Deshabilitado |
| Solo segundo checkbox | "Juan Pérez" | false | true | Deshabilitado |
| Ambos checkboxes, sin nombre | "" | true | true | Deshabilitado |
| Ambos checkboxes, nombre 1 char | "J" | true | true | Deshabilitado |
| Ambos checkboxes, nombre 2 chars | "Jo" | true | true | Deshabilitado |
| Ambos checkboxes, nombre 3 chars | "Ana" | true | true | **Habilitado** |
| Ambos checkboxes, nombre normal | "Juan Pérez López" | true | true | **Habilitado** |
| Ambos checkboxes, solo espacios | "   " | true | true | Deshabilitado |
| Ambos checkboxes, nombre con espacios borde | "  Jo  " | true | true | Deshabilitado |

### Dataset E — Respuestas de API para aceptación

**POST /v1/quotes/FOL-2026-00042/accept — Request:**
```json
{
  "acceptedBy": "Juan Pérez López",
  "version": 8
}
```

**Response 200 (éxito):**
```json
{
  "folioNumber": "FOL-2026-00042",
  "quoteStatus": "ISSUED",
  "acceptedBy": "Juan Pérez López",
  "acceptedAt": "2026-04-23T18:30:00Z",
  "version": 9
}
```

**Response 409 (conflicto de versión):**
```json
{
  "error": "Optimistic lock conflict",
  "code": "VERSION_CONFLICT"
}
```

**Response 422 (transición inválida):**
```json
{
  "error": "Cannot transition to ISSUED",
  "code": "INVALID_STATUS_TRANSITION"
}
```

---

## Tabla de Priorización para Serenity BDD

| ID Escenario | Descripción | Historia | Prioridad | Suite | Justificación |
|--------------|-------------|----------|-----------|-------|---------------|
| TC-001 | Acceso permitido con CALCULATED | HU-01 | **P1** | Smoke | Puerta de entrada al flujo; guard es crítico |
| TC-002 | Acceso denegado con IN_PROGRESS | HU-01 | **P1** | Smoke | Regla de negocio RN-01 principal |
| TC-003 | Acceso denegado con CREATED | HU-01 | **P1** | Regression | Variante del guard |
| TC-004 | Acceso denegado con ISSUED | HU-01 | **P1** | Smoke | Evita doble emisión — riesgo de negocio alto |
| TC-005 | Resumen ejecutivo con datos correctos | HU-01 | **P1** | Smoke | Visibilidad de datos calculados antes de comprometerse |
| TC-006 | Solo ubicaciones calculables en lista | HU-01 | **P1** | Smoke | Regla RN-03 — impacto directo en prima mostrada |
| TC-007 | Carga por GET sin router state | HU-01 | **P2** | Regression | Acceso directo por URL — escenario frecuente en producción |
| TC-008 | Error 404 al cargar resultado | HU-01 | **P2** | Regression | Resiliencia ante endpoints pendientes (deuda técnica) |
| TC-009 | Bloque T&C scrollable con 5 secciones | HU-02 | **P2** | Regression | Requisito legal — LFPDPPP requiere visibilidad de texto |
| TC-010 | Botón deshabilitado — todos vacíos | HU-02 | **P1** | Smoke | Estado inicial obligatorio — riesgo de aceptación incompleta |
| TC-011 | Botón deshabilitado — primer checkbox solo | HU-02 | **P1** | Smoke | Validación parcial del formulario |
| TC-012 | Botón deshabilitado — segundo checkbox solo | HU-02 | **P1** | Regression | Complemento de TC-011 |
| TC-013 | Botón deshabilitado — checkboxes OK, nombre vacío | HU-02 | **P1** | Smoke | Regla RN-02 — nombre es requerido |
| TC-014 | Botón habilitado — formulario válido completo | HU-02 | **P1** | Smoke | Condición necesaria para TC-016 |
| TC-015 | Barra de finalización con timestamp | HU-02 | **P2** | Regression | Visibilidad de vigencia (RN-04) |
| TC-016 | Aceptación exitosa — folio pasa a ISSUED | HU-03 | **P1** | Smoke | Flujo principal del feature — riesgo máximo |
| TC-017 | Error 409 — conflicto de versión | HU-03 | **P1** | Smoke | Escenario de concurrencia probable en multi-usuario |
| TC-018 | Error 422 — transición inválida | HU-03 | **P1** | Smoke | Integridad del estado del folio |
| TC-019 | Botón PDF dispara window.print() | HU-03 | **P2** | Regression | Funcionalidad auxiliar — bajo riesgo de negocio |
| TC-020 | Volver al resultado desde cabecera | HU-03 | **P2** | Regression | Navegación básica |
| TC-021 | Botón "Volver al panel" no visible antes de aceptar | HU-03 | **P2** | Regression | Control de flujo post-aceptación |
| TC-022 | Nombre con solo espacios — deshabilitado | Edge | **P1** | Smoke | RN-02 explícita: trim antes de validar minLength |
| TC-023 | Nombre 2 chars — deshabilitado | Edge | **P1** | Smoke | Límite inferior de minLength (3) |
| TC-024 | Nombre 3 chars — habilitado | Edge | **P1** | Smoke | Límite mínimo exacto que habilita el botón |
| TC-025 | Folio ISSUED — guard redirige | Edge | **P1** | Smoke | Previene re-aceptación de folio ya emitido |
| TC-026 | Error de red — mensaje genérico | Edge | **P1** | Smoke | Resiliencia ante fallos no previstos de red |
| TC-027 | Nombre "  Jo  " con trim = 2 chars | Edge | **P2** | Regression | Variante de TC-022/TC-023 |
| TC-028 | Formulario bloqueado tras aceptación | Edge | **P2** | Regression | RN-08 — permanencia del estado confirmado |

### Resumen por prioridad

| Prioridad | Cantidad | Suite principal | Automatizar en |
|-----------|----------|-----------------|----------------|
| **P1** | **17** | Smoke + Regression | Sprint actual (obligatorio) |
| **P2** | **11** | Regression | Sprint siguiente |
| **P3** | 0 | — | — |
| **Total** | **28** | — | — |

### Distribución por Historia de Usuario

| Historia | Escenarios P1 | Escenarios P2 | Total |
|----------|--------------|--------------|-------|
| HU-01 (Resumen ejecutivo) | 5 | 3 | 8 |
| HU-02 (Términos y aceptación) | 5 | 2 | 7 |
| HU-03 (Finalización) | 3 | 4 | 7 |
| Escenarios de borde | 4 | 3 | 7 |
| **Total** | **17** | **12** | **28** |

> Nota: TC-028 no tiene P3 porque su lógica ya está implícita en TC-016 (RN-08);
> se mantiene como escenario de regresión separado para trazabilidad explícita.

---

## Notas de Implementación para Serenity BDD

### Consideraciones para el equipo de automatización

1. **Endpoint POST /v1/quotes/{folio}/accept es deuda técnica** (RN-05). Los escenarios TC-016, TC-017 y TC-018 deben usar stubs WireMock mientras el backend no implemente el endpoint. El service usa respuesta optimista cuando recibe 404.

2. **Orden de automatización recomendado:**
   - Primera iteración: FC-02 (guard) → FC-03 (formulario boundary) → FC-01 (happy path)
   - Segunda iteración: FC-04 (errores) → escenarios P2

3. **Datos deterministas:** usar siempre `FOL-2026-00042` como folio de prueba con los valores del Dataset A. Para tests de estado diferente, usar el mismo folio con stubs de `QuoteStateService` que retornen el estado requerido.

4. **Aislamiento del guard:** los escenarios TC-002 a TC-004 y TC-025 deben stub-ear el `QuoteStateService.obtenerEstado()` para retornar el estado deseado sin hacer llamada real al backend.

5. **window.print():** en automatización E2E (TC-019), interceptar la llamada con un spy de JavaScript antes de hacer click, y verificar que fue invocada. No esperar el diálogo de impresión del sistema operativo.

6. **Trazabilidad:** cada escenario lleva en sus tags el ID de escenario (`@SPEC-010-TC-XXX`) para vincular resultados de Serenity con esta tabla.
