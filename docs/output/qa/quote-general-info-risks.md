# Matriz de Riesgos ASD — SPEC-005: quote-general-info
**Fecha:** 2026-04-22
**Feature:** Datos Generales de la Cotización (Paso 1 de 5)
**QA Lead:** ASDD
**Metodología:** Risk-Based Testing — clasificación ASD (Alto / Medio / Bajo)

---

## Criterio de clasificación ASD

| Nivel | Impacto si falla | Esfuerzo de prueba |
|-------|------------------|--------------------|
| **Alto** | Pérdida de datos, inconsistencia de negocio, sobreescritura silenciosa o bloqueo del flujo completo del cotizador | Obligatorio — cobertura unitaria + escenario Gherkin + regresión |
| **Medio** | Degradación de UX: el usuario puede continuar pero con fricción, datos incorrectos o mensajes confusos | Recomendado — escenario Gherkin y/o test unitario |
| **Bajo** | Cosmético: no afecta flujo ni datos, solo aspecto visual o texto secundario | Opcional — exploración manual |

---

## Tabla de Riesgos

### Riesgos ALTO

| ID | Componente | Riesgo | Criterio relacionado | Impacto | Mitigación existente |
|----|-----------|--------|---------------------|---------|----------------------|
| R-001 | `GeneralInfoService.guardar()` | La versión optimista no se envía en el cuerpo del PUT. El backend procesaría la petición sin control de concurrencia, permitiendo sobreescritura silenciosa de datos. | CRITERIO-3.1 | Pérdida de cambios de otra sesión sin notificación al usuario | Test unitario: "should call PUT with request body and return GeneralInfoResponse" verifica que `req.request.body` contenga `version: 2` |
| R-002 | `GeneralInfoService.guardar()` | El error 409 `VERSION_CONFLICT` es capturado silenciosamente (p.ej. con `catchError` que retorna vacío), impidiendo que el componente muestre el mensaje de conflicto. | CRITERIO-3.1 | El agente cree que guardó cuando en realidad hubo conflicto | Test unitario: "should propagate HTTP 409 VERSION_CONFLICT error" verifica que el error se propaga sin captura |
| R-003 | `rfcValidator` | El validador acepta RFC con formato incorrecto (longitud errónea, solo dígitos, guiones). El backend rechazaría la petición pero el usuario solo lo sabría tras el PUT, no en tiempo real. | CRITERIO-1.3 | Llamadas HTTP fallidas al backend por datos malformados; UX degradada | 6 tests en `rfc.validator.spec.ts` cubren moral válido, física válido, corto, largo, vacío y minúsculas |
| R-004 | Filtrado dinámico de agentes por suscriptor | Si el filtro falla (ej. `filter()` con campo incorrecto), el agente puede seleccionar un `agentCode` que no pertenece al suscriptor. El backend rechaza o asigna responsabilidad incorrecta. | CRITERIO-2.1 | Asignación técnica incorrecta de la cotización; error de negocio grave | Escenario Gherkin CRITERIO-2.1 cubre el filtrado y la limpieza al cambiar suscriptor |
| R-005 | `GeneralInfoService.cargar()` | Si el GET retorna 404 y el error no se propaga, el formulario queda vacío sin mensaje. El agente puede guardar un folio inexistente con datos en blanco. | CRITERIO-1.2 (implícito) | Formulario sin datos de contexto; posible creación de datos huérfanos | Test unitario: "should propagate HTTP 404 error when cargar() receives not found" |

---

### Riesgos MEDIO

| ID | Componente | Riesgo | Criterio relacionado | Impacto | Mitigación existente |
|----|-----------|--------|---------------------|---------|----------------------|
| R-006 | Validaciones de formulario ReactiveForm | ~~Los validadores no están enlazados al template con mensajes de error.~~ **FALSO POSITIVO — CERRADO:** Los organismos `InsuredDataFormComponent` y `UnderwritingDataFormComponent` exponen getters (`nameError`, `rfcError`, `emailError`, `phoneError`, `subscriberIdError`, `agentCodeError`, `riskError`, `businessError`) que se pasan a `[error]` en cada `<app-field>`. Los mensajes de error sí se muestran en tiempo real. | CRITERIO-1.2, CRITERIO-2.3 | — | Implementado correctamente. Getters de error en ambos organisms verificados en code review 2026-04-22. |
| R-007 | Manejo de error 422 `VALIDATION_ERROR` | ~~El componente no mapea `fields[]` a controles del formulario.~~ **MITIGADO:** La página ahora itera `err.error.fields[]` y muestra los mensajes de cada campo si están disponibles; si `fields` está vacío, muestra un mensaje genérico. El formato exacto de `fields` depende del backend (no especificado en contrato). | Regla de negocio #8 | Mínimo: el usuario ve los campos con error si el backend los informa. | Fix aplicado en `general-info.page.ts` — 2026-04-22. Test unitario `should propagate HTTP 422 VALIDATION_ERROR` verifica que el error llega al componente. |
| R-008 | `forkJoin` en `ngOnInit` | Si `CatalogService` falla al cargar suscriptores o agentes, el `forkJoin` completo se cancela y los selects quedan vacíos sin mensaje de error. **GAP ACEPTADO:** La política del proyecto prohíbe tests de componentes (`.claude/rules/testing.md`). El código sí maneja el error con `this.errorMessage = \`Error al cargar los datos (${err.status})\``. Cobertura E2E vía escenarios Gherkin. | CRITERIO-2.1, CRITERIO-2.3 | El agente no puede completar la suscripción; formulario parcialmente bloqueado | Código maneja el error. Test unitario no posible por política. GAP aceptado. Pendiente cobertura E2E en `Auto_Front_Screenplay`. |
| R-009 | Limpieza de campo agente al cambiar suscriptor | Si el FormControl `agentCode` no se limpia al cambiar `subscriberId`, el valor anterior (de otro suscriptor) persiste en el formulario reactivo aunque no sea visible en el select. | CRITERIO-2.1 | El PUT envía un `agentCode` inconsistente con el `subscriberId` | Escenario Gherkin CRITERIO-2.1 segundo escenario cubre este caso |
| R-010 | `takeUntilDestroyed()` en suscripciones | Si las suscripciones RxJS no se cancelan al destruir el componente, pueden llegar respuestas HTTP tardías y mutar el estado de un componente ya destruido (memory leak). | N/A (no-funcional) | Memory leak en SPA; errores de "Expression changed after it was checked" en navegación | Regla de implementación en spec sección 2 — no hay test automatizado para esto |

---

### Riesgos BAJO

| ID | Componente | Riesgo | Criterio relacionado | Impacto |
|----|-----------|--------|---------------------|---------|
| R-011 | Badge de completitud | El badge no cambia de estado visual al completar todos los campos de una tarjeta. Solo es cosmético si la lógica de negocio no lo requiere como gate. | CRITERIO-2.2 | Visual únicamente; no bloquea el guardado |
| R-012 | Alerta informativa de versión | El texto "Versionado optimista activo — versión actual: vN" no refleja la versión actualizada tras un guardado exitoso. El número desactualizado puede confundir al agente. | CRITERIO-1.1 | Desinformativo pero no bloquea el flujo |
| R-013 | Estilos de tarjeta `InsuredDataFormComponent` | El grid de 2 columnas se rompe en pantallas < 768px. | N/A | Solo cosmético en viewport reducido |
| R-014 | Placeholder y labels en español | Algún label aparece en inglés por un string sin traducir. | N/A | Solo cosmético; no afecta la lógica |

---

## Resumen de Cobertura de Riesgos

| Nivel | Total identificados | Cubiertos por tests | GAPs |
|-------|---------------------|---------------------|------|
| Alto  | 5 | 5 | 0 |
| Medio | 5 | 4 | 1 (R-008: forkJoin error no testado) |
| Bajo  | 4 | 0 | 4 (optativos — exploración manual) |

### GAP crítico identificado — R-008
El escenario de fallo del `forkJoin` en `ngOnInit` (error al cargar catálogos) no está cubierto por ningún test unitario. Se recomienda agregar un test en `general-info.service.spec.ts` o en un test de la página que mockee `CatalogService` lanzando error y verifique el comportamiento del componente.

---

## Priorización de ejecución de pruebas

1. **Smoke (en cada PR):** R-001, R-002, R-003, R-004, R-005 — riesgos Alto
2. **Regresión completa (pre-release):** R-006, R-007, R-008, R-009, R-010 — riesgos Medio
3. **Exploración manual (sprint demo):** R-011, R-012, R-013, R-014 — riesgos Bajo
