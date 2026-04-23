# Matriz de Riesgos — quote-locations (SPEC-007)

> Generado: 2026-04-22
> Spec: `.claude/specs/quote-locations.spec.md`
> Regla ASD: **A** = Obligatorio (bloquea release) · **S** = Recomendado · **D** = Opcional

---

## Resumen Ejecutivo

| Total | Alto (A) | Medio (S) | Bajo (D) |
|-------|----------|-----------|----------|
| 10    | 4        | 3         | 3        |

---

## Matriz de Riesgos

| ID    | HU              | Descripción del Riesgo                                                                                         | Factores de Riesgo                                           | Nivel | Testing Requerido |
|-------|-----------------|----------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|-------|-------------------|
| R-001 | HU-02           | CP lookup falla por indisponibilidad del servicio core (8081): el `debounceTime(400)` + `filter(v => v.length === 5)` dispara una llamada HTTP a un proceso externo no controlado. Un corte de la red o downtime del core deja al agente sin poder avanzar al paso siguiente si ninguna ubicación tiene CP válido. | Integración externa · proceso no controlado · bloqueo de flujo | **A** | Obligatorio       |
| R-002 | HU-05           | Conflicto de versión optimista 409 no manejado o manejado incorrectamente: si `actualizarParcial()` recibe 409 y el componente no recarga el drawer con los datos frescos, el agente puede seguir editando con datos obsoletos y perder cambios de otro proceso. | Concurrencia · lógica de negocio crítica · integridad de datos | **A** | Obligatorio       |
| R-003 | HU-04           | Alertas bloqueantes `NO_TARIFABLE` o `MISSING_FIRE_KEY` afectan el cálculo de prima cuando **todas** las ubicaciones son `INCOMPLETE`: aunque la spec permite guardar ubicaciones incompletas individualmente, si el 100% queda incompleto, el paso de cálculo (paso 5) se bloquea. La UI no advierte de este estado global de forma prominente. | Impacto en suma asegurada · regla de negocio crítica · flujo de múltiples componentes | **A** | Obligatorio       |
| R-004 | HU-02           | `CatalogService.obtenerGiros()` con `shareReplay(1)` queda en estado de error permanente si la primera carga falla: todo observable posterior comparte el error sin posibilidad de reintento, dejando el selector de giro inoperante para todos los drawers de la sesión. | Integración externa · singleton con estado de error irrecuperable | **A** | Obligatorio       |
| R-005 | HU-02 / HU-03   | Drawer con 4 pestañas y validación en tiempo real: el `FormGroup` maestro del `LocationDrawerComponent` con sub-grupos por pestaña puede generar inconsistencias de estado si el usuario cambia de pestaña antes de que el lookup de CP complete (respuesta HTTP en vuelo al cambiar tab). | Complejidad de componente · condiciones de carrera · estado compartido | **S** | Recomendado       |
| R-006 | HU-02           | El campo CP usa `debounceTime(400)` + `filter(v => v.length === 5)` pero no cancela la petición HTTP anterior si el usuario escribe rápido: dos lookups en vuelo simultáneos pueden llegar fuera de orden (race condition), populando el formulario con datos de un CP diferente al que el agente terminó de escribir. | Condición de carrera · RxJS · UX crítica                    | **S** | Recomendado       |
| R-007 | HU-01           | El banner `LocationsAlertBannerComponent` obtiene el resumen desde `GET /v1/quotes/{folio}/locations/summary`, pero si ese endpoint no se refresca tras cada `PATCH` exitoso, el banner puede mostrar conteos de alertas obsoletos, dando al agente una percepción falsa del estado del folio. | Sincronización de estado · múltiples fuentes de verdad       | **S** | Recomendado       |
| R-008 | HU-06           | Selección múltiple en tabla con `Set<number>`: si el usuario selecciona todas las filas con el checkbox de header y luego guarda una ubicación que modifica la lista (agregar o eliminar), el `Set` de selección queda desfasado respecto a los índices reales, activando operaciones en lote sobre índices inexistentes. | Funcionalidad secundaria · estado de UI inconsistente        | **D** | Opcional          |
| R-009 | HU-01           | Botones "Exportar CSV" y "Duplicar" son puramente visuales sin funcionalidad: generan deuda técnica si no se documentan como no implementados; el agente podría usarlos esperando una acción y no recibir retroalimentación alguna (ni mensaje de "próximamente"). | Deuda técnica · UX confusa                                  | **D** | Opcional          |
| R-010 | HU-05           | Suma asegurada desactivada no resetea a `0` en el payload PATCH: si el frontend envía `insuredValue: null` en lugar de `0` al desactivar un `GUA-*`, el backend puede rechazar con 422 o persistir un valor nulo que rompa el cálculo de prima neta. | Regla de negocio #7 · contrato de API · datos inconsistentes | **D** | Opcional          |

---

## Plan de Mitigación — Riesgos ALTO (A)

### R-001: CP lookup falla por indisponibilidad del servicio core

- **Descripción**: El `ZipCodeService.buscar()` apunta a `http://localhost:8081` (core OHS), un proceso externo al quoter (8080). Un downtime del core durante la captura impide que el agente valide el CP, dejando la ubicación en `INCOMPLETE` sin posibilidad de avanzar si todas las ubicaciones lo requieren.
- **Mitigación**:
  - El `ZipCodeService` debe implementar `catchError` que mapee errores de red (`0` / `ERR_CONNECTION_REFUSED`) a un `HttpErrorResponse` con código `ZIP_CODE_SERVICE_UNAVAILABLE` y un mensaje claro diferenciado del 404.
  - El `LocationBasicDataTabComponent` debe mostrar dos mensajes distintos: "Código postal no encontrado en el catálogo" (404) y "Servicio de catálogo no disponible. Intente de nuevo." (error de red).
  - Aplicar `retryWhen` con backoff exponencial (máximo 2 reintentos) antes de mostrar el error al usuario.
  - Agregar `timeout(5000)` al observable del lookup para no bloquear la UI indefinidamente.
- **Tests obligatorios**:
  - `ZipCodeService` — `buscar() propaga errores de red` (ya en lista de tareas de spec).
  - `ZipCodeService` — `buscar() distingue 404 de error de red en el mensaje de error`.
  - Test E2E (Serenity BDD): simular timeout del core y verificar que el agente ve el mensaje correcto y puede guardar la ubicación como `INCOMPLETE`.
- **Bloqueante para release**: Si en QA manual o en CI el lookup falla sin mensaje claro, el release se bloquea. La ubicación debe siempre poder guardarse (aunque quede `INCOMPLETE`).

---

### R-002: Conflicto de versión optimista 409 sin recarga del drawer

- **Descripción**: `actualizarParcial()` envía la `version` actual del folio. Si otro proceso (otro agente, sesión paralela) modificó el folio entre la apertura del drawer y el click en "Guardar ubicación", el backend retorna 409 `VERSION_CONFLICT`. La spec indica que el drawer debe recargar la ubicación con la versión más reciente. Si este reload no ocurre, el agente edita datos obsoletos y al reintentar podría volver a generar 409 en bucle.
- **Mitigación**:
  - En el handler de error del drawer, al recibir 409, llamar a `LocationService.listar(folio)` para obtener los datos frescos y reinicializar el `FormGroup` del drawer con la nueva `version`.
  - Mostrar el mensaje "El folio fue modificado por otro proceso. Recargando datos..." (CRITERIO-5.2) y esperar la recarga antes de habilitar el botón "Guardar ubicación" nuevamente.
  - Crear un type guard `isVersionConflict(err: unknown): boolean` compartido (análogo al recomendado en SPEC-006) que valide `err.status === 409` **y** `err.error?.code === 'VERSION_CONFLICT'`.
- **Tests obligatorios**:
  - `LocationService` — `actualizarParcial() propaga error 409 VERSION_CONFLICT` (en lista de tareas de spec).
  - `LocationService` — `reemplazarLista() propaga error 409 VERSION_CONFLICT`.
  - Test de integración E2E (Serenity BDD): simular 409 en PATCH y verificar que el drawer muestra mensaje y recarga los datos sin perder el estado del formulario de otras pestañas.
- **Bloqueante para release**: Si el 409 no se maneja con recarga, dos agentes editando el mismo folio simultáneamente generarán sobreescrituras silenciosas. Bloqueante absoluto.

---

### R-003: Todas las ubicaciones INCOMPLETE bloquean cálculo de prima sin advertencia prominente

- **Descripción**: La regla de negocio establece que el cálculo de prima solo se bloquea si **todas** las ubicaciones son `INCOMPLETE`. Sin embargo, la UI de la pantalla de ubicaciones (paso 3) no muestra una advertencia de nivel de folio que informe al agente de este estado. El agente puede navegar al paso 4 o 5 sin percibir que el cálculo fallará. El banner `LocationsAlertBannerComponent` muestra alertas por ubicación individual, pero no el estado agregado crítico.
- **Mitigación**:
  - Añadir lógica en `LocationsPageComponent` que evalúe el `LocationsSummary`: si `completeLocations === 0` y `totalLocations > 0`, mostrar un banner de nivel `error` (rojo) con el mensaje "Ninguna ubicación está completa. No será posible calcular la prima hasta completar al menos una.".
  - El banner de alertas existente (`LocationsAlertBannerComponent`) debe distinguir `warn` (algunas incompletas) de `error` (todas incompletas).
  - El botón "Siguiente paso" del wizard debe estar deshabilitado o mostrar un diálogo de confirmación cuando `completeLocations === 0`.
- **Tests obligatorios**:
  - `LocationService.obtenerResumen()` — test existente en lista de tareas.
  - Test E2E (Serenity BDD): folio con 3 ubicaciones todas `INCOMPLETE` → verificar que aparece banner de error y el botón de avance está deshabilitado.
  - Test E2E: 1 ubicación `COMPLETE` + 2 `INCOMPLETE` → verificar que el banner es de advertencia y el botón de avance está habilitado.
- **Bloqueante para release**: La ausencia de esta advertencia puede llevar al agente a presentar una cotización sin prima calculada, lo que es un error de negocio grave. Bloqueante hasta que el estado agregado esté representado en la UI.

---

### R-004: `CatalogService.obtenerGiros()` con `shareReplay(1)` queda en error permanente

- **Descripción**: El `shareReplay(1)` cachea el **último valor o error** emitido. Si la primera llamada a `GET /v1/business-lines` falla (504, timeout, core caído), el observable queda en estado `error` en el replay buffer. Cada drawer que abra el agente posteriormente se suscribirá al mismo observable en error, sin posibilidad de reintento, dejando el selector de giro vacío en toda la sesión sin refrescar la página.
- **Mitigación**:
  - Usar `shareReplay({ bufferSize: 1, refCount: true })` en lugar de `shareReplay(1)` para evitar referencias "zombie".
  - Agregar `catchError` en `obtenerGiros()` antes del `shareReplay`: si falla, emitir un array vacío `[]` y registrar el error en consola, o bien rethrowing con un flag que permita al componente mostrar un mensaje de "Error al cargar giros de negocio. Recargando...".
  - Alternativa más robusta: no usar `shareReplay` en el service sino en el componente `LocationBusinessLineTabComponent` con un `ReplaySubject` propio que permita forzar un refresh explícito.
- **Tests obligatorios**:
  - `CatalogService` — `obtenerGiros() usa shareReplay(1) — segunda suscripción no genera nueva llamada HTTP` (en lista de tareas de spec).
  - **Nuevo test**: `obtenerGiros() cuando la primera llamada falla, la segunda suscripción puede reintentar` (actualmente no está en la lista de tareas — GAP identificado).
  - Test E2E: simular 503 en `GET /v1/business-lines` → recargar el drawer → verificar que el select de giro intenta nuevamente y carga el catálogo si el servicio se recupera.
- **Bloqueante para release**: Un `shareReplay` que cachea errores es un bug silencioso de alta severidad en SPAs de larga sesión. Bloqueante hasta demostrar en QA que el catálogo se recupera tras un error transitorio.

---

## Riesgos MEDIO — Acciones Recomendadas

### R-005: Race condition entre lookup de CP y cambio de pestaña en el drawer

El `debounceTime(400)` reduce colisiones pero no cancela peticiones HTTP en vuelo. Si el agente escribe el CP en la pestaña "Datos básicos" y cambia a "Garantías" antes de que la respuesta llegue, el observable puede emitir y mutar el `FormGroup` mientras la pestaña no es visible. Usar `switchMap` (no `mergeMap` ni `concatMap`) en el lookup garantiza que solo la última petición importa. Verificar que el operador RxJS usado en el template/componente sea efectivamente `switchMap`. Agregar test unitario que simule dos lookups rápidos y verifique que solo el último popula el formulario.

### R-006: Race condition por múltiples lookups de CP sin cancelación (sin `switchMap`)

Si `buscar()` está implementado con `mergeMap`, dos peticiones en vuelo pueden llegar en orden invertido. La segunda (CP correcto) llega antes que la primera (CP previo), y la primera, al llegar tarde, sobreescribe los campos con datos incorrectos. La solución es garantizar `switchMap` en el operador de transformación del `valueChanges`. Cubrir con test unitario de `ZipCodeService` que simule respuestas fuera de orden.

### R-007: Banner de alertas no se refresca tras PATCH exitoso

`LocationsAlertBannerComponent` consume `obtenerResumen()` en el `ngOnInit` de `LocationsPageComponent`. Tras un `PATCH` exitoso que cambia el `validationStatus` de una ubicación, el componente no re-llama al endpoint de resumen automáticamente. El banner podría mostrar "1 con alertas" cuando la ubicación ya fue completada. Implementar un mecanismo de refresh (signal o `BehaviorSubject`) en `LocationsPageComponent` que se dispare tras cada `actualizarParcial()` exitoso y re-ejecute `obtenerResumen()`.

---

## Riesgos BAJO — Backlog

### R-008: Selección múltiple desfasada tras modificación de lista

El `Set<number>` de índices seleccionados se invalida si el PATCH de una ubicación genera un reordenamiento de índices en el backend. Impacto bajo porque las acciones en lote no están implementadas. Pendiente para el sprint en que se implemente "Eliminar selección" o "Duplicar".

### R-009: Botones "Exportar CSV" y "Duplicar" sin funcionalidad ni feedback

Añadir estado `disabled` con `title="Disponible próximamente"` o `cursor-not-allowed` para evitar que el agente haga click esperando una acción. Sin esto, el agente puede reportar como bug un comportamiento esperado del roadmap.

### R-010: `insuredValue` nulo en lugar de `0` al desactivar garantía

La regla de negocio #7 exige `insuredValue: 0` (no nulo) cuando un guarantee se desactiva. Verificar que el `LocationGuaranteesTabComponent` resetea el control del formulario a `0` (no a `null` ni a `''`). Sin este test, el backend puede recibir un payload inválido en producción.

---

## Gaps de cobertura identificados

| Gap | Riesgo asociado | Acción requerida |
|-----|-----------------|-----------------|
| `CatalogService` — no existe test de recuperación tras error inicial en `shareReplay` | R-004 | Agregar test a `catalog.service.spec.ts` antes del release |
| `ZipCodeService` — no existe test que valide distinción entre 404 y error de red | R-001 | Agregar test a `zip-code.service.spec.ts` |
| No existe test E2E del flujo "todas las ubicaciones INCOMPLETE → avance bloqueado" | R-003 | Agregar escenario en `Auto_Front_Screenplay` |

---

## Criterios de Release

- Todos los riesgos **ALTO** deben tener cobertura de test (unitario + E2E para los críticos).
- Riesgos **MEDIO** documentados con plan de mitigación y al menos un test recomendado en verde.
- Riesgos **BAJO** en backlog del próximo sprint con issue creado en GitHub.

| Riesgo | Criterio de desbloqueo |
|--------|------------------------|
| R-001 | Test `buscar() propaga errores de red` en verde + mensaje diferenciado validado en QA manual |
| R-002 | Test `actualizarParcial() propaga error 409` en verde + escenario Serenity de recarga del drawer |
| R-003 | Escenario E2E "0 ubicaciones completas → botón de avance deshabilitado" en verde |
| R-004 | Test de recuperación de `shareReplay` tras error en verde + validación manual de sesión larga |
