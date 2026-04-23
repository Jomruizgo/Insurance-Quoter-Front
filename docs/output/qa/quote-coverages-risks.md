# Matriz de Riesgos — quote-coverages (SPEC-008)

> Generado por: QA Lead — ASDD Risk Identifier
> Fecha: 2026-04-23
> Spec de referencia: `.claude/specs/quote-coverages.spec.md` (estado: IMPLEMENTED)
> Feature: Opciones de Cobertura por Ubicación — Paso 4/5 del wizard de cotización

---

## Resumen

| Nivel | Cantidad | Acción |
|-------|----------|--------|
| **ALTO (A)** | 7 | Testing obligatorio — bloquea release |
| **MEDIO (S)** | 5 | Testing recomendado |
| **BAJO (D)** | 3 | Testing opcional |
| **Total** | **15** | |

---

## Detalle

| ID    | HU / Componente / Endpoint | Descripción del Riesgo | Factores | Nivel | Testing requerido |
|-------|---------------------------|------------------------|----------|-------|-------------------|
| R-001 | `CoverageService.guardar()` — PUT /v1/quotes/{folio}/coverage-options | El array `coverageOptions` enviado al backend alimenta directamente el cálculo de prima (paso 5). Un payload incorrecto (valores de deducible o coaseguro mal mapeados, `version` ausente o errónea) produce un cálculo de prima incorrecto sin que el usuario lo perciba. | Datos financieros directos; operación de escritura; propaga al cálculo de prima del paso siguiente | **ALTO** | Tests unitarios de `CoverageService.guardar()` — verificar body completo, cobertura 100% de ramas de error |
| R-002 | `CoverageService.guardar()` — Control optimista (versión) | La lógica de `version` es el mecanismo de integridad ante ediciones concurrentes. Si `version` no se actualiza en el estado local tras un 200, la siguiente operación de guardado envía la versión obsoleta, generando un 409 silencioso o datos corruptos en la póliza. | Control optimista; lógica de negocio crítica; estado local mutable | **ALTO** | Test unitario que verifica que `version` se actualiza en el estado tras cada respuesta 200 del PUT |
| R-003 | `TechnicalInfoPage.onSave()` — manejo 409 VERSION_CONFLICT | Si el 409 no se captura y muestra al usuario, este no sabrá que sus cambios no se persistieron. El agente podría avanzar al paso 5 y calcular prima sobre datos desactualizados, afectando el costo final de la póliza. | Dato financiero; flujo de error crítico; sin retroalimentación = dato silenciosamente incorrecto | **ALTO** | Test E2E (Serenity) que simula 409 y valida mensaje de error visible; no bloquear UI |
| R-004 | `TechnicalInfoPage.ngOnInit()` — inicialización con `DEFAULT_COVERAGE_OPTIONS` | Si `coverageOptions` llega vacío desde la API y la inicialización por defecto falla (o no se ejecuta), la pantalla queda vacía o con estado inconsistente. El agente no puede configurar coberturas y el folio avanza sin ellas al cálculo. | Lógica de inicialización condicional; impacto en dato financiero aguas abajo | **ALTO** | Test de integración que simula GET con array vacío y verifica estado local inicializado con las 6 coberturas del catálogo |
| R-005 | `CoverageService.obtener()` — GET /v1/quotes/{folio}/coverage-options | Fallo silencioso al cargar (sin manejo de error en `TechnicalInfoPage`) dejaría la pantalla bloqueada o vacía. El agente no tiene forma de saber si el problema es de red o de datos, lo que puede llevar a avanzar sin coberturas configuradas. | Integración externa; flujo de error de red; impacto en continuidad del wizard | **ALTO** | Test unitario `CoverageService.obtener()` con 404 — ya existe. Validar que el componente muestra estado de error y botón "Reintentar" |
| R-006 | `CoverageOptionsGridComponent` — propagación de `coverageChanged` | La cadena de eventos `CoverageCardComponent` → `CoverageOptionsGridComponent` → `TechnicalInfoPage` actualiza el array `coverageOptions`. Una ruptura en esta cadena (por referencia compartida en lugar de nuevo objeto, o EventEmitter no conectado) hace que el usuario vea cambios en UI pero guarde datos anteriores. | Lógica de actualización de datos financieros; patrón de eventos anidados; riesgo de referencia compartida | **ALTO** | Verificar en Serenity E2E que modificar deducible y guardar persiste el valor correcto vía PUT |
| R-007 | `TechnicalInfoPage.onCoverageChanged()` — reemplazo por referencia de `code` | Al reemplazar la cobertura modificada en el array por `code`, un error de comparación (ej. código incorrecto, índice en lugar de code) actualiza la cobertura equivocada. Enviar coberturas con deducibles o coaseguros intercambiados impacta directamente en el cálculo de prima. | Lógica de negocio crítica; datos financieros; mutación de estado con identificador de negocio | **ALTO** | Test unitario de la función `onCoverageChanged` — verificar que solo el ítem con el `code` correcto se reemplaza en el array |
| R-008 | `LocationTabSelectorComponent` — estado de coberturas activas por tab | El contador "N/M coberturas activas" en cada tab se deriva del array flat. Si el cálculo del contador es incorrecto, el agente puede creer que todas las coberturas están configuradas cuando no lo están, avanzando al paso 5 con una prima mal calculada. | UX de alta frecuencia; dato derivado de información financiera; puede inducir a error al agente | **MEDIO** | Verificar manualmente con 0, 3 y 6 coberturas activas que el contador coincide |
| R-009 | `onApplyToAll()` — deep clone del estado de coberturas | Si "Aplicar a todas" no hace un deep clone sino que copia referencias, modificar coberturas en una tab afectará silenciosamente el array compartido de formas inesperadas. El riesgo es menor porque la API guarda el array flat, pero puede generar confusión de estado en UI. | Lógica de deep clone (`structuredClone`); estado compartido; código nuevo sin historial | **MEDIO** | Test manual: activar "Aplicar a todas", modificar una cobertura, verificar que las otras tabs no se ven afectadas inesperadamente |
| R-010 | `onCopyFrom()` — deep clone desde ubicación origen | Similar a R-009. Si "Copiar desde" no hace deep clone, los cambios posteriores en la tab activa podrían mutar el estado del tab origen. Riesgo acotado por la naturaleza flat de la API, pero genera estado inconsistente en UI. | Lógica de deep clone; código nuevo; dependencia de `LocationService.getSummary()` | **MEDIO** | Test manual: copiar desde UBIC 01, modificar un campo, verificar que UBIC 01 no cambió |
| R-011 | `TechnicalInfoPage` — dependencia de `LocationService.getSummary()` | La pantalla de coberturas depende de un servicio externo (ya implementado) para obtener las ubicaciones. Si `getSummary` devuelve un array vacío o falla, el selector de tabs no se renderiza y el botón "Aplicar a todas" queda en estado incorrecto (no visible o siempre deshabilitado). | Dependencia de servicio existente; múltiples componentes dependientes; inicialización paralela | **MEDIO** | Verificar con stub de `LocationService` que devuelve 0, 1 y N ubicaciones — validar estado de controles |
| R-012 | `CoverageCardComponent` — deshabilitación de campos cuando `selected: false` | Si `pointer-events: none` y `opacity: 0.5` no se aplican correctamente, el agente puede modificar porcentajes de una cobertura desactivada. Los valores se enviarán al backend igual, pero la UX promete que no es posible editarlos. | Regla de negocio de UI (CRITERIO-1.8); posible inconsistencia entre UX y datos enviados | **MEDIO** | Verificar manualmente que al desactivar el switch los campos quedan no editables y el badge desaparece |
| R-013 | `CoverageContextBarComponent` — visibilidad del select "Copiar desde" | La spec es explícita: el select no se renderiza con 1 o menos ubicaciones (CRITERIO-1.9). Una renderización incorrecta expone un control inoperante o causa error al intentar copiar de una ubicación inexistente. | Regla de negocio condicional; edge case de configuración mínima | **MEDIO** | Verificar con stub de 1 ubicación que el select no aparece en el DOM |
| R-014 | Estilos de `CoverageCardComponent` — fondo tintado en header cuando `selected: true` | El color primario al 7% en el header es un indicador visual de estado activo. Su ausencia no afecta la funcionalidad ni los datos, pero degrada la UX del agente al no saber visualmente qué coberturas están activas. | Ajuste estético de UI; sin impacto en datos ni lógica | **BAJO** | Revisión visual manual durante exploratoria |
| R-015 | `DEFAULT_COVERAGE_OPTIONS` — constante de valores por defecto | Si los valores por defecto del catálogo (deducibles y coaseguros) no coinciden con los definidos en la spec, el agente trabajará sobre una base incorrecta. Sin embargo, el riesgo está limitado porque el agente puede modificarlos antes de guardar. | Dato de configuración estático; impacto indirecto en financiero; fácilmente detectable | **BAJO** | Revisión puntual de la constante contra la tabla del catálogo en la spec |
| R-016 | Validaciones de step (deducible 0.5%, coaseguro 5%) en `CoverageCardComponent` | El HTML usa atributos `step` en los inputs numéricos. Si el step no está configurado correctamente, el agente puede ingresar valores fuera de la granularidad esperada. El backend debería validar con 422, pero la experiencia es degradada. | Regla de negocio de granularidad; back-stop existe en 422; impacto limitado a UX | **BAJO** | Prueba manual de ingreso de valores con decimales fuera de step |

---

## Plan de Mitigación — Riesgos ALTO

### R-001: Payload incorrecto en `CoverageService.guardar()` afecta cálculo de prima

- **Mitigación**: Los tests unitarios de `coverage.service.spec.ts` ya verifican el body del PUT (campo `coverageOptions` completo + `version`). Extender con assertions sobre todos los campos de cada `CoverageOptionRequest` para los 6 ítems del catálogo, incluyendo el caso con `selected: false`.
- **Tests obligatorios**:
  - `should include all 6 coverageOptions in PUT body with correct fields`
  - `should include version in PUT body`
  - `should send selected: false items in PUT body without omitting them`
- **Bloqueante para release**: Sí

---

### R-002: Versión no actualizada en estado local tras guardado exitoso

- **Mitigación**: En `TechnicalInfoPage.onSave()`, verificar que la respuesta del PUT (que incluye `version: N+1`) actualiza `this.version` antes de cualquier operación subsecuente. Auditar el código de `onSave` para confirmar que no hay rutas de éxito donde `version` quede sin actualizar.
- **Tests obligatorios**:
  - Test de `onSave()` que tras un PUT 200 con `version: 7`, el estado local tenga `version === 7`
  - Test de reintento: tras un 409, el estado local no avanza la versión
- **Bloqueante para release**: Sí

---

### R-003: Error 409 VERSION_CONFLICT silencioso

- **Mitigación**: Verificar en el handler de error de `onSave()` que el mensaje "Los datos han cambiado en otro proceso. Recarga para continuar." se establece en la propiedad `error` del estado local. Confirmar que el template lo renderiza.
- **Tests obligatorios**:
  - Escenario E2E Serenity: navegar, guardar, recibir 409, verificar texto del mensaje visible en pantalla
  - Test unitario de la función de manejo de error: verificar que `error` se asigna con el mensaje correcto al recibir `status === 409`
- **Bloqueante para release**: Sí

---

### R-004: Inicialización vacía no ejecutada o con catálogo incorrecto

- **Mitigación**: Auditar la rama condicional en `ngOnInit` que verifica `if (!response.coverageOptions || response.coverageOptions.length === 0)`. Confirmar que `DEFAULT_COVERAGE_OPTIONS` tiene exactamente 6 ítems con `selected: false` y los porcentajes de la spec.
- **Tests obligatorios**:
  - Test de integración (con `HttpTestingController`): GET que responde `coverageOptions: []` → verificar que el estado local tiene las 6 coberturas del catálogo con `selected: false`
  - Test complementario: GET que responde `coverageOptions` con 6 ítems ya persistidos → verificar que NO se sobrescribe con los valores por defecto
- **Bloqueante para release**: Sí

---

### R-005: Error de red al cargar coberturas sin retroalimentación al usuario

- **Mitigación**: El test de `CoverageService.obtener()` con 404 ya existe y pasa. El riesgo residual es en la capa de componente: verificar que `TechnicalInfoPage` suscribe al error del Observable y establece `this.error` con el mensaje CRITERIO-1.7. Verificar que el botón "Reintentar" re-ejecuta el GET.
- **Tests obligatorios**:
  - Test E2E (Serenity): GET falla con 503 → verificar mensaje de error y funcionalidad del botón "Reintentar"
  - Test unitario del handler de error en `ngOnInit` (si la lógica es extraíble)
- **Bloqueante para release**: Sí

---

### R-006: Cadena de eventos rota entre `CoverageCard` y `TechnicalInfoPage`

- **Mitigación**: Verificar en el código de `TechnicalInfoPage` que el binding `(coverageChanged)="onCoverageChanged($event)"` está conectado a través de `CoverageOptionsGridComponent`. Dado que los componentes no se testean unitariamente, este riesgo debe cubrirse obligatoriamente con un test E2E que modifique un campo y guarde.
- **Tests obligatorios**:
  - Escenario E2E Serenity: activar COV-FIRE, cambiar deducible a 3%, guardar, verificar que el PUT contiene `deductiblePercentage: 3` para COV-FIRE
- **Bloqueante para release**: Sí

---

### R-007: Lógica de `onCoverageChanged()` actualiza cobertura incorrecta

- **Mitigación**: La función `onCoverageChanged(updated: CoverageOption)` debe reemplazar el ítem del array `coverageOptions` cuyo `code === updated.code`. Si se usa índice de array en lugar de `code`, un reordenamiento puede silenciosamente intercambiar coberturas.
- **Tests obligatorios**:
  - Test unitario de la función: dado un array de 6 coberturas, llamar `onCoverageChanged` con un ítem de COV-THEFT modificado → verificar que solo el ítem con `code === 'COV-THEFT'` cambia en el array y los otros 5 permanecen iguales
- **Bloqueante para release**: Sí

---

## Cobertura de Tests existentes (al momento de la revisión)

| Artefacto | Tests presentes | Cobertura estimada | Suficiente |
|-----------|----------------|-------------------|------------|
| `coverage.service.ts` | 6 casos (happy + error paths) | ~100% de ramas del servicio | Sí para el servicio |
| `TechnicalInfoPage` | Sin tests (componente — por convención del proyecto) | 0% | No aplicable por regla de proyecto |
| Componentes (`CoverageCard`, `CoverageOptionsGrid`, etc.) | Sin tests (componentes — por convención) | 0% | No aplicable por regla de proyecto |
| Flujos E2E (Serenity) | No existen aún para este feature | 0% | **Pendiente — obligatorio para R-003, R-005, R-006** |

> **Brecha crítica detectada**: Los riesgos R-002, R-004 y R-007 involucran lógica en `TechnicalInfoPage` que no puede cubrirse con tests unitarios de service ni con E2E de UI. Se recomienda extraer las funciones `onCoverageChanged`, la inicialización condicional y el manejo de versión a funciones puras o a un servicio de estado (`CoverageStateService`) para hacerlas testables bajo TDD.

---

## Leyenda de Niveles ASD

| Nivel | Criterio | Acción |
|-------|----------|--------|
| **ALTO (A)** | Datos financieros, control optimista, integraciones externas, operaciones con impacto en cálculo de prima, flujos de error críticos sin retroalimentación | Testing obligatorio — bloquea release si no se cubre |
| **MEDIO (S)** | Lógica condicional de UI con impacto en experiencia, dependencias entre servicios, código nuevo sin historial de pruebas, reglas de negocio de presentación | Testing recomendado — no bloquea pero debe resolverse en el sprint |
| **BAJO (D)** | Estilos decorativos, constantes de configuración estática, validaciones con back-stop en backend, granularidad de inputs | Testing opcional — puede diferirse a regresión visual |
