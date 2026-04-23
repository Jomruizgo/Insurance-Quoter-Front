---
id: RISK-SPEC-010
feature: quote-terms-and-conditions
spec: SPEC-010
skill: risk-identifier
author: qa-lead
created: 2026-04-23
---

# Matriz de Riesgos — SPEC-010: Términos y Condiciones

## Resumen ejecutivo

| Clasificación ASD | Cantidad | Acción recomendada |
|-------------------|----------|--------------------|
| Alto (A)          | 6        | Cobertura obligatoria antes del release — bloquea el DoD |
| Medio (M)         | 5        | Cobertura recomendada — debe estar en el ciclo de regresión |
| Bajo (B)          | 3        | Opcional — documentar como riesgo aceptado si el sprint no da tiempo |

**Total de riesgos identificados: 14**

Acción recomendada general: los 6 riesgos de clasificación Alta deben tener test de cobertura
verificado y escenario de QA ejecutado antes de marcar la spec como `IMPLEMENTED`. Los
riesgos Medios deben incluirse en la suite de regresión del sprint siguiente. Los riesgos Bajos
se documentan como riesgo aceptado hasta que el equipo tenga capacidad de abordarlos.

---

## Tabla de riesgos (orden: mayor a menor criticidad)

| ID     | Descripción                                                                                                                                                         | Clasificación ASD | Probabilidad | Impacto   | Mitigación recomendada                                                                                                                                                                                   |
|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|--------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| R-001  | **Endpoint inexistente en producción.** `POST /v1/quotes/{folio}/accept` es deuda técnica pendiente. Si el backend lleva el endpoint a producción con un contrato distinto al especificado en la RN-05, el service fallará silenciosamente o con errores no controlados. | Alto (A)          | Alta         | Crítico   | Añadir un test de contrato (contract test) entre el mock del service y el contrato documentado en la spec. Bloquear el merge del backend hasta que `api-contracts.md` refleje el endpoint. Agregar alerta visible en la UI cuando el backend responde 404 en lugar de usar el mock optimista sin feedback al usuario. |
| R-002  | **Transición de estado irreversible sin confirmación.** El cambio `CALCULATED → ISSUED` es permanente en el backend. Si el agente hace click accidentalmente o si un error de red completa la petición antes de mostrar error, el folio queda ISSUED sin posibilidad de revertir en la sesión actual. | Alto (A)          | Media        | Crítico   | Agregar un paso de confirmación modal antes de ejecutar `onAccept()`. El guard ya protege la entrada a la pantalla, pero una vez dentro no hay barrera adicional. Cubrir el escenario "click accidental con formulario válido" en la suite de regresión E2E. |
| R-003  | **Optimistic lock con `version` desincronizada.** Si el agente carga la pantalla y deja el folio abierto mientras otro usuario modifica el registro, la `version` almacenada en `result.version` queda obsoleta. Al intentar aceptar, el backend responde 409. El frontend maneja el mensaje de error, pero no refresca automáticamente la `version` ni el folio — el agente debe recargar manualmente, lo cual puede no ser obvio. | Alto (A)          | Media        | Alto      | Agregar botón "Recargar datos" explícito en el mensaje de error 409. Cubrir en el test del service que el error 409 propaga `VERSION_CONFLICT` (ya cubierto en `terms.service.spec.ts`). Verificar en regresión que el mensaje orienta al usuario a recargar. |
| R-004  | **Guard bypasseable por manipulación de estado del router.** El `termsGuard` llama a `QuoteStateService.obtenerEstado()` que es una llamada HTTP real. Si la respuesta de red falla (error de red, timeout) el Observable lanza error y el guard no maneja el caso de error: Angular podría denegar la navegación sin mostrar feedback al usuario, o dependiendo de la versión del router, podría dejar la navegación colgada. | Alto (A)          | Media        | Alto      | Agregar `catchError` en el guard que en caso de error de red redirija explícitamente a `/cotizador` y muestre un mensaje. Añadir caso de prueba en `terms.guard.spec.ts`: "should redirect to /cotizador when obtenerEstado() throws error". |
| R-005  | **Estado inconsistente del folio si `QuoteStateService.refresh()` falla.** En `onAccept()`, tras recibir respuesta 200 del backend (folio ya es ISSUED), se llama `quoteStateService.refresh()`. Si este refresh falla (error de red), el StatusBar sigue mostrando `CALCULATED` aunque el folio ya es ISSUED en base de datos. El usuario puede creer que la aceptación no ocurrió y reintentar — el segundo intento recibirá 422 `INVALID_STATUS_TRANSITION`. | Alto (A)          | Media        | Alto      | Capturar el error de `refresh()` de forma silenciosa y establecer `accepted = true` antes de llamar `refresh()` (ya es el orden correcto en el código actual). Agregar test de integración que simule `refresh()` fallando tras un 200 exitoso y verificar que `accepted` permanezca en `true`. Informar al usuario que el folio fue aceptado aunque la pantalla de estado pueda tardar en actualizarse. |
| R-006  | **XSS en el campo `acceptedBy`.** El valor de `acceptedBy` se captura del formulario ReactiveForm y se envía directamente al backend como string. Angular escapa la interpolación en templates, pero si el valor se usa en contextos inseguros (innerHTML, logs de backend, reportes PDF generados por el servidor), puede convertirse en vector XSS. La validación actual solo impone `minLength(3)` sin sanitizar caracteres HTML/script. | Alto (A)          | Baja         | Alto      | Agregar validación de patron en el `FormControl` de `acceptedBy` que rechace caracteres HTML (`<`, `>`, `"`, `'`, `&`). Ejemplo: `Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]{3,}$/)`. Añadir caso de prueba en `acceptance-form` (si se decide testear) o documentar como riesgo aceptado con mitigación en el backend. |
| R-007  | **`window.print()` no disponible en entornos SSR ni en todos los navegadores.** La implementación actual llama `window.print()` directamente en `onDownloadPdf()`. En entornos con Server-Side Rendering habilitado o en navegadores móviles con restricciones, esta llamada puede fallar o no mostrar el diálogo de impresión esperado. | Medio (M)         | Baja         | Medio     | Envolver `window.print()` en una comprobación `if (typeof window !== 'undefined')`. Registrar en el backlog una tarea para reemplazar por generación real de PDF cuando el backend lo soporte. Probar manualmente en Chrome, Firefox y Safari antes del release. |
| R-008  | **Respuesta optimista puede desinformar al usuario.** Cuando el backend aún no tiene implementado `POST /v1/quotes/{folio}/accept`, el service usa un mock optimista que devuelve `quoteStatus: 'ISSUED'` sin que realmente ocurra en la base de datos. El agente ve la confirmación "Cotización finalizada" pero el folio sigue en `CALCULATED` en el sistema. Si el agente vuelve a consultar el folio en una sesión posterior, verá que no está emitido. | Medio (M)         | Alta         | Alto      | Documentar claramente en la pantalla que la aceptación está en modo de demostración hasta que el backend esté disponible. Agregar un `console.warn` o un banner visual que indique el estado de deuda técnica. Priorizar la tarea BE-02 en el backlog. |
| R-009  | **`CalculationResult` leído desde `history.state` puede ser `undefined` en recarga de página.** El Caso A depende de que el estado del router esté disponible en `history.state`. Si el usuario recarga la página (F5), `history.state` queda vacío y el código cae al Caso B — que llama al endpoint `GET /v1/quotes/{folio}/calculation-result`, el cual también es deuda técnica. Si ambos fallan, la pantalla muestra error y el agente no puede completar el flujo. | Medio (M)         | Alta         | Medio     | Asegurarse de que el mensaje de error del Caso B oriente explícitamente al usuario a volver a cálculo. Priorizar la tarea BE-01 en el backlog. Documentar este escenario en el plan de regresión como caso a verificar manualmente. |
| R-010  | **Botón "Aceptar" habilitado con `acceptedBy` de solo espacios en blanco.** El `FormControl` aplica `Validators.required` y `Validators.minLength(3)`. Sin embargo, una cadena de 3 espacios (`"   "`) pasa `minLength(3)` aunque el componente aplica `.trim()` en `emitChange()`. La page recibe `acceptedBy: ""` (string vacío tras trim) pero `valid: true` (el FormControl no sabe del trim). Esto podría enviar al backend un `acceptedBy` vacío. | Medio (M)         | Media        | Medio     | Agregar `Validators.pattern(/\S/)` al `FormControl` de `acceptedBy` para rechazar strings de solo espacios, o bien agregar un validador personalizado que valide `value.trim().length >= 3`. Añadir caso de prueba con input `"   "` y verificar que `form.valid` sea `false`. |
| R-011  | **`takeUntilDestroyed()` en `AcceptanceFormComponent` puede causar subscripciones huérfanas.** El `takeUntilDestroyed()` se usa en el constructor, lo que es correcto para Angular 19. Sin embargo, si el componente se destruye antes de que el formulario emita su primer evento, `ngOnInit` llama `emitChange()` manualmente — si hay alguna condición de carrera con la destrucción, el evento puede llegar a la página después de que esta también haya sido destruida. | Medio (M)         | Baja         | Medio     | Verificar en el plan de regresión que no haya errores de "component destroyed" en consola al navegar rápidamente desde y hacia la pantalla. Considerar añadir `DestroyRef` explícito si se detectan problemas en ambientes de prueba. |
| R-012  | **StatusBar no se actualiza visualmente si `refresh()` es síncrono pero el componente padre no detecta el cambio.** `QuoteStateService.refresh()` puede ser Observable o Subject; si usa `BehaviorSubject`, el StatusBar debería actualizar automáticamente. Pero si el AppShellComponent (SPEC-006) usa `OnPush` change detection, es posible que el cambio no se propague hasta el siguiente ciclo de detección. | Medio (M)         | Baja         | Medio     | Verificar en prueba manual que el StatusBar cambia a ISSUED inmediatamente tras la aceptación. Documentar en el plan de regresión este escenario de integración entre SPEC-010 y SPEC-006. |
| R-013  | **Guard no cubre el estado `ISSUED` de forma explícita.** El guard redirige a `/calculation` para cualquier estado que no sea `CALCULATED`, incluyendo `ISSUED`. Esto significa que si el agente intenta volver a la pantalla de T&C tras aceptar (por ejemplo usando el botón "Atrás" del navegador), verá la pantalla de cálculo en lugar de un mensaje informativo de que el folio ya fue emitido. | Bajo (B)          | Media        | Bajo      | Considerar agregar una ruta de solo lectura para folios ISSUED, o mostrar un mensaje informativo en la pantalla de cálculo cuando el folio está en estado ISSUED. Documentar como mejora futura. |
| R-014  | **Ausencia de límite máximo en el campo `acceptedBy`.** El `FormControl` solo valida `minLength(3)` pero no tiene `maxLength`. Un input de cientos de caracteres se enviaría al backend sin restricción. Si el backend no valida la longitud, podría ocasionar problemas en campos de base de datos con restricciones de longitud. | Bajo (B)          | Baja         | Bajo      | Agregar `Validators.maxLength(150)` al `FormControl` de `acceptedBy`. Tarea de bajo esfuerzo, bajo impacto inmediato. |

---

## Recomendaciones de cobertura de tests para riesgos Alto

### R-001 — Endpoint inexistente en producción

**Cobertura requerida en:** `terms.service.spec.ts`

Casos de prueba obligatorios adicionales a los existentes:
- `should handle 404 response with optimistic mock when endpoint is not implemented` — verificar que cuando el backend retorna 404, el service devuelve la respuesta optimista con `quoteStatus: 'ISSUED'` y no propaga el error (si la RN-05 se implementa en el service).
- Verificar que el contrato del body `{ acceptedBy, version }` coincide exactamente con lo documentado en la spec antes de cada release con el backend.

Nota: los tests actuales en `terms.service.spec.ts` cubren 200, 409 y 422, pero no cubren el escenario 404 con fallback optimista descrito en la RN-05.

---

### R-002 — Transición de estado irreversible sin confirmación

**Cobertura requerida en:** prueba manual de regresión (QA-05 de la spec)

No aplica test unitario de Angular (el componente no se testea por lineamiento). Se requiere:
- Caso de prueba exploratorio: ejecutar `onAccept()` con formulario válido y verificar que existe algún mecanismo de confirmación o que el botón no sea fácilmente accionable por error.
- Escenario Serenity BDD (E2E): "El agente acepta los términos y el folio transiciona a ISSUED de forma permanente".

---

### R-003 — Optimistic lock con `version` desincronizada

**Cobertura requerida en:** `terms.service.spec.ts` (ya cubierto parcialmente)

El test de 409 existe. Añadir:
- Verificar que tras 409 el mensaje de error en la UI orienta al usuario a recargar (prueba manual o E2E).
- Documentar en el plan de regresión como escenario de prueba de concurrencia.

---

### R-004 — Guard bypasseable por error de red

**Cobertura requerida en:** `terms.guard.spec.ts`

Caso de prueba faltante (no existe en el spec actual):
```typescript
it('should redirect to /cotizador when obtenerEstado() throws a network error', async () => {
  // GIVEN
  quoteStateService.obtenerEstado.and.returnValue(throwError(() => new Error('Network error')));
  const route = buildRoute('FOL-001');

  // WHEN
  const result = await runGuard(route);

  // THEN
  expect(result).toBeInstanceOf(UrlTree);
  // URL debe ser /cotizador o /cotizador/quotes/FOL-001/calculation
});
```

---

### R-005 — Estado inconsistente si `refresh()` falla

**Cobertura requerida en:** prueba de integración manual

No aplica test unitario del componente por lineamiento. Verificar manualmente:
- Simular fallo de red en `QuoteStateService.refresh()` (DevTools > Network > Offline) tras una aceptación exitosa.
- Confirmar que `accepted = true` y que la UI muestra "Cotización finalizada" aunque el StatusBar no actualice.
- Confirmar que un segundo click en "Aceptar" no es posible (botón deshabilitado por `accepted = true`).

---

### R-006 — XSS en el campo `acceptedBy`

**Cobertura requerida en:** validación de formulario (unitario si se decide testear el componente, o como test del guard/service si el sanitizado se mueve a esa capa)

Caso de prueba recomendado si se agrega el validador de patrón al `FormControl`:
- Input `"<script>alert(1)</script>"` → `form.valid === false`
- Input `"Juan & María"` → evaluar si el ampersand es aceptable o debe rechazarse

Dado que el lineamiento del proyecto no testea componentes, este riesgo debe mitigarse en la capa de validación del backend y documentarse como control compensatorio.

---

## Notas de auditoría

- La spec SPEC-010 tiene `status: APPROVED` en el frontmatter del header YAML pero el cuerpo del documento indica `DRAFT` en la nota introductoria. Esto es una inconsistencia menor que debe resolverse actualizando el texto del cuerpo de la spec para que coincida con el frontmatter.
- Los tests existentes en `terms.service.spec.ts` y `terms.guard.spec.ts` cubren correctamente los flujos happy path y los principales errores (409, 422, IN_PROGRESS, CREATED, ISSUED). La cobertura de los riesgos Altos R-004 y R-001 (caso 404) requiere casos de prueba adicionales no presentes actualmente.
- `TermsService` no implementa el fallback optimista para 404 descrito en la RN-05 de la spec — el servicio actual propaga todos los errores. Esto es una discrepancia entre la spec y el código implementado que debe resolverse.
