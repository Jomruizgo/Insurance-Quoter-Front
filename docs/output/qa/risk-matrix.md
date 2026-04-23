# Matriz de Riesgos — App Shell (SPEC-003)

> Feature: `app-shell` | Generado: 2026-04-22 | Estado spec: `IMPLEMENTED`

---

## Resumen

| Total | Alto (A) | Medio (S) | Bajo (D) |
|-------|----------|-----------|----------|
| 9     | 4        | 3         | 2        |

---

## Detalle

| ID    | HU     | Descripción del Riesgo                                                             | Factores                                            | Nivel | Testing     |
|-------|--------|------------------------------------------------------------------------------------|-----------------------------------------------------|-------|-------------|
| R-001 | HU-04  | POST /v1/folios retorna 400/422 y el error no se muestra al usuario                | Integración con sistema externo, código nuevo       | A     | Obligatorio |
| R-002 | HU-04  | Respuesta 200 idempotente no trata igual que 201 — no navega al folio              | Integración con sistema externo, lógica de negocio  | A     | Obligatorio |
| R-003 | HU-02  | QuoteStateService devuelve 404 y el Stepper queda sin estado visible               | Integración con sistema externo, alta frecuencia    | A     | Obligatorio |
| R-004 | HU-04  | Doble submit del modal (botón no se deshabilita durante petición)                  | Operación de escritura crítica, código nuevo        | A     | Obligatorio |
| R-005 | HU-02  | Mapeo incorrecto de `SectionStatus` a íconos del Stepper (check/alerta/número)     | Lógica de negocio compleja, muchas dependencias     | S     | Recomendado |
| R-006 | HU-04  | Filtrado de agentes por `subscriberId` devuelve lista vacía o incorrecta           | Lógica de negocio en cliente, código nuevo          | S     | Recomendado |
| R-007 | HU-05  | Visibilidad condicional de Stepper/StatusBar falla al navegar rápido entre rutas   | Componente con muchas dependencias, estado reactivo | S     | Recomendado |
| R-008 | HU-01  | Breadcrumb no muestra el folio activo al navegar a `/quotes/:folio/...`            | Ajuste de UI, sin impacto funcional directo         | D     | Opcional    |
| R-009 | HU-03  | `SparklineComponent` no refleja correctamente el `completionPercentage`            | Ajuste visual, sin impacto funcional directo        | D     | Opcional    |

---

## Plan de Mitigación — Riesgos ALTO

### R-001: Error HTTP en POST /v1/folios no mostrado al usuario

- **HU:** HU-04 — CRITERIO-4.3
- **Mitigación:** El `NewFolioModalComponent` captura el `error` del observable y asigna `errorMessage` que se renderiza con el átomo de alerta. El botón se reactiva al recibir el error (`isLoading = false`).
- **Tests obligatorios:**
  - `folio.service.spec.ts` → test de error 400 (ya implementado #52)
  - Test E2E: verificar que el mensaje de error aparece en el DOM del modal
- **Cobertura mínima:** 80% en `folio.service.ts`
- **Bloqueante para release:** ✅ Sí

### R-002: Idempotencia POST /v1/folios — 200 vs 201

- **HU:** HU-04 — CRITERIO-4.4
- **Mitigación:** `FolioService.crearFolio()` usa `HttpClient.post()` que trata 200 y 201 de forma idéntica (ambos emiten `next`). El `NewFolioModalComponent` navega en el `next` callback sin discriminar código de estado.
- **Tests obligatorios:**
  - `folio.service.spec.ts` → test idempotente 200 (ya implementado #52)
  - Verificación de código: confirmar que `subscribe({ next })` no diferencia entre 200 y 201
- **Bloqueante para release:** ✅ Sí

### R-003: QuoteStateService 404 deja Stepper sin estado

- **HU:** HU-02 — edge case
- **Mitigación:** `MainLayoutComponent` usa `switchMap` con `catchError` o null guard: `quoteState()` puede ser `null`, y el template usa `quoteState()?.sections` con `@if (isFolioRoute() && quoteState()?.sections)`.
- **Tests obligatorios:**
  - `quote-state.service.spec.ts` → test 404 (ya implementado #54)
  - Verificar que el template no explota si `quoteState()` es `null`
- **Bloqueante para release:** ✅ Sí

### R-004: Doble submit del modal de creación de folio

- **HU:** HU-04 — Regla de Negocio 6
- **Mitigación:** El flag `isLoading` se activa en `submit()` antes de la petición HTTP y el botón usa `[disabled]="form.invalid || isLoading"`. El flag se desactiva tanto en `next` como en `error`.
- **Tests obligatorios:**
  - Verificar que `isLoading` es `true` durante la petición
  - Verificar que el botón queda habilitado al recibir error (no bloqueado indefinidamente)
- **Bloqueante para release:** ✅ Sí

---

## Decisiones de Riesgo Aceptado

| ID    | Decisión                                                                           | Responsable |
|-------|------------------------------------------------------------------------------------|-------------|
| R-008 | Riesgo visual — aceptado para la iteración actual; se verifica en revisión de UI  | QA          |
| R-009 | Lógica de `clampPct` ya cubierta en `sparkline.utils.spec.ts` (SPEC-001)          | QA          |
