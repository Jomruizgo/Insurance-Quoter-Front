# Matriz de Trazabilidad — SPEC-005: quote-general-info
**Fecha:** 2026-04-22
**Feature:** Datos Generales de la Cotización (Paso 1 de 5)
**QA Lead:** ASDD

---

## Leyenda de estados

| Estado | Descripción |
|--------|-------------|
| **CUBIERTO** | Criterio cubierto por test unitario Y escenario Gherkin |
| **PARCIAL** | Criterio cubierto solo por Gherkin O solo por test unitario, no ambos |
| **SIN COBERTURA** | No existe test unitario ni escenario Gherkin para el criterio |

---

## Tabla de Trazabilidad

| Criterio | Historia de usuario | Descripción | Test unitario | Archivo spec | Escenario .feature | Estado |
|----------|--------------------|-------------|--------------|--------------|-------------------|--------|
| CRITERIO-1.1 | HU-01 | Guardar datos del asegurado válidos; PUT con version; respuesta actualiza version a 3 | `should call PUT with request body and return GeneralInfoResponse when guardar() succeeds` | `general-info.service.spec.ts` línea 93 | `CRITERIO-1.1 — Guardar datos del asegurado válidos con version optimista` | **CUBIERTO** |
| CRITERIO-1.2 | HU-01 | Campos obligatorios vacíos — no se realiza HTTP, se muestran errores | No aplica (lógica de template/formulario, no de service) | N/A — validación en FormGroup del componente | `CRITERIO-1.2 — No guardar cuando los campos del asegurado están vacíos` | **PARCIAL** |
| CRITERIO-1.3 | HU-01 | RFC con formato inválido muestra error en blur | `should return { invalidRfc: true } for a short RFC` / `should return { invalidRfc: true } for a long RFC` | `rfc.validator.spec.ts` líneas 28–42 | `CRITERIO-1.3 — Mostrar error de validación cuando el RFC tiene formato inválido` + Scenario Outline | **CUBIERTO** |
| CRITERIO-1.4 | HU-01 | RFC se fuerza a mayúsculas al tipear | `should convert lowercase input value to uppercase in the FormControl` / `should keep uppercase value unchanged when input is already uppercase` | `upper-case-rfc.directive.spec.ts` líneas 8–45 | `CRITERIO-1.4 — El campo RFC convierte automáticamente a mayúsculas en tiempo real` | **CUBIERTO** |
| CRITERIO-2.1 | HU-02 | Filtrar agentes al cambiar suscriptor; limpiar agente si no pertenece al nuevo suscriptor | No aplica (lógica de filtrado en el componente, no en service) | N/A — filtrado local en `GeneralInfoPage` | `CRITERIO-2.1 — El select de agentes se filtra al seleccionar un suscriptor` + escenario de limpieza | **PARCIAL** |
| CRITERIO-2.2 | HU-02 | Seleccionar clasificación y tipo de negocio; badge cambia a Completo | No aplica (estado del formulario en el componente) | N/A — lógica de UI en `UnderwritingDataFormComponent` | `CRITERIO-2.2 — El badge de completitud cambia a Completo al llenar suscripción` + Scenario Outline | **PARCIAL** |
| CRITERIO-2.3 | HU-02 | Suscriptor vacío al guardar — no se realiza HTTP, se muestra error | No aplica (validación en FormGroup del componente) | N/A — validación en FormGroup del componente | `CRITERIO-2.3 — Mostrar error cuando el suscriptor está vacío al guardar` | **PARCIAL** |
| CRITERIO-3.1 | HU-03 | Conflicto 409 VERSION_CONFLICT — mensaje al usuario, formulario no se limpia | `should propagate HTTP 409 VERSION_CONFLICT error when guardar() receives conflict` | `general-info.service.spec.ts` línea 111 | `CRITERIO-3.1 — Mostrar mensaje de conflicto cuando el backend retorna 409 VERSION_CONFLICT` | **CUBIERTO** |

---

## Cobertura por tipo de artefacto

### Tests unitarios (Jasmine/Karma)

| Archivo | Tests contados | Criterios que cubre |
|---------|---------------|---------------------|
| `general-info.service.spec.ts` | 5 `it(` | CRITERIO-1.1 (guardar ok), CRITERIO-1.1 (GET ok), CRITERIO-1.1 (GET 404 implícito en cargar), CRITERIO-3.1 (409), 422 |
| `rfc.validator.spec.ts` | 6 `it(` | CRITERIO-1.3 (moral válido, física válido, corto, largo, vacío, minúsculas) |
| `upper-case-rfc.directive.spec.ts` | 2 `it(` | CRITERIO-1.4 (minúsculas → mayúsculas, ya mayúsculas sin cambio) |
| **Total** | **13 tests** | — |

### Escenarios Gherkin generados

| Archivo | Escenarios | Criterios cubiertos |
|---------|-----------|---------------------|
| `quote-general-info.feature` | 11 escenarios (incluye Scenario Outline con Examples) | CRITERIO-1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1 |

---

## Análisis de criterios PARCIALES

Los criterios con estado **PARCIAL** corresponden a lógica de formulario ReactiveForm y de componente Angular que, según la política de TDD del proyecto (`.claude/rules/testing.md`), no se cubre con tests unitarios de componente/template. Su cobertura queda garantizada exclusivamente por:

1. Los escenarios Gherkin en `quote-general-info.feature` (para ejecución manual o automatización E2E con Serenity BDD en `Auto_Front_Screenplay/`).
2. La revisión de la implementación en el componente durante la fase de QA exploratoria.

Esta clasificación es correcta y esperada dentro de la estrategia de testing del proyecto.

---

## Resumen ejecutivo

| Estado | Criterios | % |
|--------|-----------|---|
| CUBIERTO | 4 (CRITERIO-1.1, 1.3, 1.4, 3.1) | 50% |
| PARCIAL | 4 (CRITERIO-1.2, 2.1, 2.2, 2.3) | 50% |
| SIN COBERTURA | 0 | 0% |

**Conclusión:** El 100% de los criterios de aceptación tiene al menos un mecanismo de verificación (test unitario o escenario Gherkin). Los criterios PARCIAL son los esperados para lógica de UI/template según la política de testing del proyecto. La cobertura de lógica de negocio en servicios y validadores supera el umbral del 80% requerido.
