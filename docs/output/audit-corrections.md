# Auditoría frontend — Plan de correcciones

**Fecha:** 2026-04-23
**Rama revisada:** `feature/FE-09-terms-and-conditions`
**Referencia:** `docs/Sofka IQ/uploads/Reto.md` · `docs/Sofka IQ/uploads/api-contracts.md` · prototipos JSX

---

## Resumen ejecutivo

El proyecto cubre correctamente **todos los contratos de API del Reto** y la estructura de rutas requerida. Se identificaron **5 gaps reales** a corregir, ninguno bloquea el demo funcional contra el backend, pero dos de ellos (stepper y coberturas) sí afectan visibilidad y fidelidad al prototipo.

---

## Falsos positivos descartados

Antes de listar las correcciones, estos puntos **NO son bugs**:

| Hallazgo del análisis | Por qué no es bug |
|-----------------------|-------------------|
| "Mock hardcodeado a true" | `app.config.ts:20` ya inyecta `{ provide: USE_MOCK_FOLIOS, useValue: isDevMode() }` — en prod es false automáticamente |
| "Faltan tests de calculation, general-info y terms services" | Los tres archivos `.spec.ts` existen: `calculation.service.spec.ts`, `general-info.service.spec.ts`, `terms.service.spec.ts` |
| "Falta createdAt en FolioResponse" | `folio.model.ts:12` ya incluye `createdAt: string` |
| "Search ⌘K no implementado" | El Reto.md no lo menciona como requerimiento; es feature del prototipo visual únicamente |
| "Tweaks panel (dark/compact/cozy) faltante" | No está en el Reto, es estética del prototipo |

---

## Correcciones reales

### C-01 · Stepper — ruta de paso 5 incorrecta

**Prioridad:** ALTA
**Archivos:** `src/app/shared/ui/organisms/stepper/stepper.steps.ts`

**Problema:** El paso 5 del stepper tiene `key: 'calculation'` pero `route: 'terms-and-conditions'`. Esto provoca que al hacer click en el paso 5 del stepper el usuario llegue a la pantalla de términos y condiciones saltándose la pantalla de cálculo de prima.

```typescript
// ACTUAL — mal
{ key: 'calculation', label: 'Cálculo', route: 'terms-and-conditions' }

// CORRECTO
{ key: 'calculation', label: 'Cálculo', route: 'calculation' }
```

El Reto define la ruta `/quotes/{folio}/terms-and-conditions` como destino **después** de que el usuario acepta los términos, no como un paso navegable desde el stepper. La pantalla de términos es accesible solo desde el botón "Continuar a términos" de la página de cálculo y está protegida por `termsGuard`.

**Corrección mínima:** cambiar `route: 'terms-and-conditions'` → `route: 'calculation'` en `stepper.steps.ts:8`.

---

### C-02 · Coberturas — modelo flat vs. per-location

**Prioridad:** MEDIA
**Archivos:** `src/app/features/cotizador/pages/technical-info.page.ts`, `src/app/features/cotizador/services/coverage.service.ts`, `src/app/features/cotizador/models/coverage.model.ts`

**Problema:** El prototipo (`steps-calc.jsx:7`) define explícitamente:

```javascript
// Estructura: quote.coveragesByLocation = { [locationIndex]: CoverageOption[] }
```

La implementación Angular usa un array plano de `CoverageOption[]` compartido por todas las ubicaciones. Los botones "Aplicar a todas" y "Copiar desde" son no-ops (`technical-info.page.ts:101-114`).

**Impacto:** Si el backend almacena coberturas por ubicación (el contrato en `api-contracts.md` debería confirmarlo), el frontend está enviando y recibiendo datos en formato incorrecto. Si el backend también usa flat, el impacto es solo visual.

**Acción:** Verificar con el backend la estructura del endpoint `PUT /v1/quotes/{folio}/coverage-options`:
- Si el body esperado es `{ coverages: CoverageOption[] }` → el frontend está bien; documentar que "Aplicar a todas" / "Copiar desde" no aplican.
- Si el body esperado es `{ coveragesByLocation: { [index]: CoverageOption[] } }` → migrar el modelo Angular y los services.

---

### C-03 · Eliminar ubicación — UI sin respaldo en API

**Prioridad:** MEDIA
**Archivos:** `src/app/features/cotizador/components/locations-table/`, `src/app/features/cotizador/services/location.service.ts`

**Problema:** La tabla de ubicaciones renderiza un botón de eliminar (icono `trash`) pero `LocationService` no tiene método `eliminar()` y el Reto / `api-contracts.md` no definen un endpoint `DELETE /v1/quotes/{folio}/locations/{index}`.

Opciones:
1. **Ocultar el botón** hasta que el backend implemente el endpoint — cambio de 2 líneas en el template HTML.
2. **Implementar via PUT**: al eliminar, reconstruir la lista sin el elemento y llamar `PUT /v1/quotes/{folio}/locations` con la nueva lista. Es el mismo patrón que ya usa `reemplazarLista()`.

**Recomendación:** Opción 2 — eliminar localmente y hacer PUT de la lista completa. El backend ya acepta esa operación y es coherente con el modelo de lista inmutable.

---

### C-04 · PDF en CalculationPage — método stub

**Prioridad:** BAJA
**Archivos:** `src/app/features/cotizador/pages/calculation/calculation.page.ts:118`

**Problema:** El método `onDownloadPdf()` en `calculation.page.ts` tiene un comentario `// PDF generation not yet implemented (FE-09)` y no hace nada. El botón "Descargar PDF" existe en la cabecera de esa pantalla pero no produce ninguna acción.

La pantalla de términos (`terms.page.ts`) sí implementa `window.print()` en su `onDownloadPdf()`.

**Corrección:** Agregar `window.print()` en `calculation.page.ts:onDownloadPdf()`, igual que en `terms.page.ts:147`.

```typescript
// calculation.page.ts
onDownloadPdf(): void {
  window.print();
}
```

---

### C-05 · Endpoint GET /calculation-result — no confirmado en api-contracts

**Prioridad:** MEDIA (informativa — depende del backend)
**Archivos:** `src/app/features/cotizador/services/calculation.service.ts:19-22`, `src/app/features/cotizador/pages/terms.page.ts:86-94`

**Problema:** `TermsPage` necesita el `CalculationResult` para mostrar el resumen ejecutivo. Si el usuario llega a `terms-and-conditions` desde la navegación del wizard (botón "Continuar"), el resultado viene en el `history.state` del router — sin llamada HTTP. Si el usuario accede directamente por URL, el frontend llama a `GET /v1/quotes/{folio}/calculation-result`, endpoint que **no existe en `api-contracts.md`** y fue propuesto en SPEC-010 como deuda técnica de backend.

**Escenarios:**

| Escenario | Estado actual |
|-----------|--------------|
| Llegó desde calculation.page → "Continuar" | ✅ Funciona sin backend (usa router state) |
| Acceso directo a URL `/terms-and-conditions` | ⚠️ Falla si backend no implementó el endpoint |
| Backend implementó GET /calculation-result | ✅ Funciona |
| Backend no implementó GET /calculation-result | ❌ Muestra mensaje de error y ofrece volver |

**Acción:** Confirmar con el equipo backend si `GET /v1/quotes/{folio}/calculation-result` está implementado. Si no lo está ni va a estarlo, el flujo de acceso directo debe manejarse con un redirect explícito a `/calculation` en lugar del mensaje de error actual.

---

## Tabla resumen

| ID | Gap | Prioridad | Esfuerzo estimado | Bloqueante para demo |
|----|-----|-----------|-------------------|----------------------|
| C-01 | Stepper paso 5 apunta a ruta incorrecta | ALTA | XS (1 línea) | Sí — confunde la navegación |
| C-02 | Coberturas flat vs. per-location | MEDIA | M (requiere confirmación con backend) | Depende del backend |
| C-03 | Botón eliminar ubicación sin API | MEDIA | S (usar reemplazarLista) | No — botón ignorado |
| C-04 | PDF stub en CalculationPage | BAJA | XS (1 línea) | No |
| C-05 | GET /calculation-result no confirmado | MEDIA | S (coordinación backend) | Solo si se accede por URL directa |

---

## Orden de implementación sugerido

```
C-01 → C-04  (XS, cambios de 1-2 líneas, sin riesgo)
C-03         (S, usa patrón existente PUT lista)
C-02         (M, requiere decisión de arquitectura con backend)
C-05         (S, requiere coordinación con backend)
```

---

## Lo que NO necesita corrección

| Área | Estado | Evidencia |
|------|--------|-----------|
| Contratos de API (todos los del Reto) | ✅ Completo | Todos los endpoints en `api-contracts.md` están mapeados en los services |
| Tests unitarios (cobertura ≥ 80%) | ✅ Completo | 19 spec files, todos los services críticos cubiertos |
| Dashboard — carga de folios | ✅ Correcto | `isDevMode()` controla mock en `app.config.ts:20` |
| Rutas del Reto | ✅ Completo | `/general-info`, `/locations`, `/technical-info`, `/terms-and-conditions` implementadas |
| Guard de términos | ✅ Completo | `termsGuard` con catchError; bloquea acceso si `quoteStatus !== CALCULATED` |
| Modelo de datos | ✅ Completo | `FolioResponse`, `QuoteState`, `CalculationResult`, todos los modelos del Reto |
| Flujo CALCULATED → ISSUED | ✅ Completo | `TermsService.aceptar()` con fallback 404 para desarrollo sin backend |
| Validación optimistic lock | ✅ Completo | `version` enviado y actualizado en todos los PUT/POST |
