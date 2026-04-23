# Matriz de Riesgos — quote-layout-config (SPEC-006)

> Generado: 2026-04-22
> Spec: `.claude/specs/quote-layout-config.spec.md`
> Regla ASD: **A** = Obligatorio (bloquea release) · **S** = Recomendado · **D** = Opcional

---

## Resumen

| Total | Alto (A) | Medio (S) | Bajo (D) |
|-------|----------|-----------|----------|
| 8     | 3        | 3         | 2        |

---

## Detalle

| ID    | HU     | Descripción del Riesgo                                                      | Factores ASD                                          | Nivel | Testing       |
|-------|--------|-----------------------------------------------------------------------------|-------------------------------------------------------|-------|---------------|
| R-001 | HU-02  | El 409 (conflicto de versión optimista) se captura solo por `err.status === 409` en `LayoutPage`; si el backend cambia el código o la estructura de error, el frontend cae silenciosamente en el bloque genérico y no informa correctamente al usuario | Integración con sistema externo · lógica de negocio crítica | **A** | Obligatorio   |
| R-002 | HU-02  | Validación de rango 1–50 solo en frontend (Reactive Forms): el backend puede no aplicar la misma restricción o devolver un 422 diferente, permitiendo persistir datos inválidos si alguien llama al PUT directamente | Lógica de negocio · integración back-front            | **A** | Obligatorio   |
| R-003 | HU-02  | El stepper refleja el estado `layout = COMPLETE` solo mediante `quoteStateService.obtenerEstado()` que `MainLayoutComponent` llama en mount (no se refresca tras guardado exitoso). La navegación a `locations` tiene lugar sin que el stepper se actualice visualmente en la misma sesión | Acoplamiento implícito · componentes con muchas dependencias | **A** | Obligatorio   |
| R-004 | HU-01  | `LayoutPage.onSaved()` recibe el `LayoutConfigResponse` armado por el componente hijo (con `version = initialData?.version ?? 0`). Si `initialData` es `null` (primer guardado), la version enviada es `0`; el backend debe aceptar `0` como "sin versión previa" o rechazará con 409 | Lógica de negocio · código nuevo sin historial         | **S** | Recomendado   |
| R-005 | HU-02  | Radio cards implementadas con `<button type="button">` gestionando el `FormControl` vía `selectLocationType()`: lectores de pantalla no asocian automáticamente el estado seleccionado con el campo del formulario (sin `aria-pressed`, sin `role="radio"` ni `aria-checked`) | Funcionalidad de alta frecuencia de uso · ajuste funcional | **S** | Recomendado   |
| R-006 | HU-01  | El `LayoutPage` navega a `/quotes/:folioNumber/locations` que en `cotizador.routes.ts` apunta a un componente stub. Si ese stub no existe o lanza error, la navegación post-guardado falla silenciosamente o muestra pantalla en blanco | Código nuevo sin historial · integración entre módulos | **S** | Recomendado   |
| R-007 | HU-01  | El error de red en `load()` muestra un mensaje informativo pero no reintenta automáticamente ni ofrece acción al usuario, lo que puede confundir en entornos con conectividad inestable | Feature interna / wizard paso 2                       | **D** | Opcional      |
| R-008 | HU-02  | El input numérico usa `type="number"` nativo; en móvil puede aceptar valores con decimales antes de que Angular valide; `Number()` convierte el string correctamente, pero el UX es inconsistente si se ingresan valores como `3.5` | Ajuste estético / UX menor                            | **D** | Opcional      |

---

## Plan de Mitigación — Riesgos ALTO

### R-001: Manejo del 409 frágil por comparación de `err.status`

**Contexto:** `LayoutPage.onSaved()` en línea 70 detecta el conflicto con `err.status === 409`. El tipo es `{ status: number }` pero sin narrowing fuerte ni cobertura del código `'VERSION_CONFLICT'` del backend.

**Mitigación:**
- Crear un type guard `isVersionConflict(err: unknown): boolean` en un helper compartido que valide tanto `err.status === 409` como `err.error?.code === 'VERSION_CONFLICT'`.
- Agregar un case en `catchError` que relance errores no tipados como `UnknownError`.
- El `LayoutConfigService` ya propaga el 409 sin transformar (validado por test `should propagate HTTP 409 VERSION_CONFLICT error`), pero el `LayoutPage` no tiene test unitario del handler de error.

**Tests obligatorios:**
- `LayoutConfigService` — test existente cubre propagación del 409 (ya en verde).
- Agregar test de integración E2E (Serenity BDD) que simule 409 del backend y verifique que el mensaje correcto aparece en pantalla y no se navega.
- Considerar test de contrato (Consumer-Driven Contract) si se usa Pact o equivalente.

**Bloqueante para release:** Si el 409 nunca se muestra en QA manual ni en Serenity, el release se bloquea.

---

### R-002: Validación de rango 1–50 solo en frontend

**Contexto:** `LayoutConfigFormComponent` aplica `Validators.min(1)` y `Validators.max(50)` y el botón se deshabilita con `[disabled]="form.invalid"`. Sin embargo, no existe evidencia en la spec ni en el código de que el backend (`PUT /v1/quotes/{folio}/locations/layout`) aplique la misma restricción. Un 422 devuelto por el backend con un mensaje distinto no sería mapeado al error inline del campo.

**Mitigación:**
- Confirmar con el equipo de backend que el `PUT` valida el rango y retorna `422` con `fields: [{ field: "numberOfLocations", ... }]`.
- En `LayoutPage.onSaved()`, interceptar `err.status === 422` y mapear los `fields` del cuerpo de error a mensajes inline del formulario (actualmente no implementado).
- Agregar test de integración que simule respuesta 422 del backend y verifique que el campo muestra el error.

**Tests obligatorios:**
- Test unitario en `LayoutConfigService`: propagar 422 sin transformar (análogo al test de 409).
- Test E2E: ingresar valor `0` o `51` con validación frontend deshabilitada (bypass) y verificar que el backend rechaza y el frontend lo muestra.

**Bloqueante para release:** Si el backend no valida, un cliente malicioso puede persistir `numberOfLocations = 0` o `999`, corrompiendo la plantilla de ubicaciones en todos los pasos siguientes.

---

### R-003: Stepper desactualizado tras guardado exitoso en la misma sesión

**Contexto:** `MainLayoutComponent` carga `quoteState` mediante `quoteStateService.obtenerEstado(folio)` en un `switchMap` reactivo sobre `paramMap`. Este observable se dispara solo cuando cambia el parámetro `:folio` de la ruta padre. Al navegar de `/layout` a `/locations` dentro del mismo folio, el `paramMap` del padre **no cambia**, por lo que `quoteState` no se refresca. El stepper seguirá mostrando `layout = PENDING` o `INCOMPLETE` hasta que el usuario cambie de folio o recargue.

El comentario en `layout.page.ts` línea 62–65 documenta esto explícitamente como deuda técnica:
> "A future improvement could expose a refresh trigger via a shared signal or BehaviorSubject in QuoteStateService."

**Mitigación:**
- Implementar un `refreshTrigger$` (`BehaviorSubject<void>` o `signal`) en `QuoteStateService`.
- `MainLayoutComponent` combina `switchMap` con `combineLatest([paramMap, refreshTrigger$])`.
- `LayoutPage.onSaved()` llama a `quoteStateService.refresh()` antes de navegar.
- Alternativa mínima: recargar el estado en `MainLayoutComponent` suscribiéndose a `NavigationEnd` (ya existe `isFolioRoute` con ese patrón).

**Tests obligatorios:**
- Test unitario en `QuoteStateService` (si se agrega `refresh()`): verificar que un nuevo `obtenerEstado()` se emite tras llamar a `refresh()`.
- Test E2E (Serenity BDD): flujo completo paso 2 → guardar → verificar que el indicador del paso en el stepper cambia a `COMPLETE` sin recargar la página.

**Bloqueante para release:** El stepper es el mecanismo de orientación del usuario en el wizard de 5 pasos. Un stepper que no refleja el progreso real rompe la experiencia y puede llevar al usuario a repetir pasos ya completados.

---

## Riesgos MEDIO — Acciones Recomendadas

### R-004: `version = 0` en primer guardado

Verificar con el equipo de backend el contrato: ¿acepta `version: 0` como indicador de "recurso nuevo"? Si el backend requiere omitir el campo `version` en el primer PUT, el `SaveLayoutConfigRequest` debe ser `{ layoutConfiguration, version?: number }`. Añadir test en `LayoutConfigService` para el caso `version = 0`.

### R-005: Accesibilidad de radio cards

Agregar `role="radio"`, `aria-checked="true/false"` y `aria-label` a cada `<button>` del radio group. Agrupar con `role="radiogroup"` y `aria-label="Tipo de ubicación"`. Sin estos atributos los usuarios de lectores de pantalla no pueden operar el formulario, lo que puede constituir una brecha de accesibilidad (WCAG 2.1 AA criterio 4.1.2).

### R-006: Ruta `locations` apunta a stub

Verificar que `LocationsPage` existe y no lanza error antes de integrar el flujo completo. Si el stub es un componente vacío, la navegación es exitosa pero el usuario ve pantalla en blanco, lo que es confuso. Agregar un guard o un mensaje provisional en el stub hasta que el paso 3 esté implementado (SPEC-007 o equivalente).

---

## Cobertura actual del `LayoutConfigService`

| Método | Tests existentes | Estado |
|--------|-----------------|--------|
| `load()` — GET exitoso | 2 tests | Verde |
| `load()` — 404 propagado | 1 test | Verde |
| `save()` — PUT con body correcto | 1 test | Verde |
| `save()` — version en body | 1 test | Verde |
| `save()` — 409 propagado sin transformar | 1 test | Verde |
| `save()` — 422 propagado | **No existe** | Pendiente (R-002) |

Total: 5/6 escenarios críticos cubiertos. Cobertura de líneas estimada ≥ 85%.

---

## Criterios de bloqueo para release

| Riesgo | Criterio de desbloqueo |
|--------|----------------------|
| R-001 | Test E2E de 409 pasa en CI + validación manual en staging |
| R-002 | Confirmación escrita de backend sobre validación 422 + test de contrato o integración |
| R-003 | Stepper refleja `COMPLETE` en la misma sesión sin recarga — validado en Serenity BDD |
