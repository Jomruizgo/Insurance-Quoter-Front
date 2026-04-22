# Matriz de Riesgos — Design System Atoms (SPEC-001)

**Feature:** design-system-atoms  
**Fecha:** 2026-04-22  
**Analista:** risk-identifier (CoE QA)

---

## Resumen

Total: 11 | **Alto (A): 3** | **Medio (S): 6** | **Bajo (D): 2**

---

## Detalle

| ID    | HU     | Descripción del Riesgo | Factores | Nivel | Testing |
|-------|--------|------------------------|----------|-------|---------|
| R-001 | HU-01  | Cambio en `tokens.scss` rompe visualmente todos los átomos simultáneamente — un solo token incorrecto propaga regresión masiva | Alta frecuencia de uso · Componente con muchas dependencias · Código nuevo sin historial | **A** | Obligatorio |
| R-002 | HU-02  | `IconComponent` usa `DomSanitizer.bypassSecurityTrustHtml` — una entrada no controlada podría inyectar HTML arbitrario | Manejo de innerHTML · Integración con DomSanitizer de Angular | **A** | Obligatorio |
| R-003 | HU-05  | `ControlValueAccessor` mal implementado en Input/Select/Textarea/Switch rompe todos los formularios reactivos del cotizador | Componentes con muchas dependencias · Alta frecuencia de uso · Código nuevo | **A** | Obligatorio |
| R-004 | HU-05  | `SwitchComponent` no cumple WCAG 2.1 AA — falta `role=switch`, `aria-checked` o navegación por teclado (accesibilidad legal) | Lógica de negocio compleja (accesibilidad) · Obligación de contraste ≥ 4.5:1 | **S** | Recomendado |
| R-005 | HU-03  | `BtnComponent` disabled no bloquea eventos de clic correctamente — el formulario podría enviarse en estado inválido | Alta frecuencia de uso · Lógica de negocio (estado de UI) | **S** | Recomendado |
| R-006 | HU-04  | `StatusBadgeComponent` con estado desconocido lanza excepción en lugar de degradar gracefully | Lógica de negocio · Código nuevo sin historial | **S** | Recomendado |
| R-007 | HU-01  | Densidades (`compact`/`cozy`) no aplican a todos los átomos por especificidad CSS | Lógica de negocio compleja (cascada CSS) · Componentes con muchas dependencias | **S** | Recomendado |
| R-008 | HU-06  | `SparklineComponent` recibe valores fuera de rango sin clamping — la barra desborda su contenedor | Lógica de negocio (clamp matemático) | **S** | Recomendado |
| R-009 | HU-06  | `StatCardComponent` con `tone` inválido no resuelve el color de acento | Código nuevo · Edge case de tipado TypeScript | **S** | Recomendado |
| R-010 | HU-06  | `SectionHeaderComponent` sin `eyebrow` ni `subtitle` genera espacios vacíos visibles | Ajuste de layout · Código nuevo | **D** | Opcional |
| R-011 | HU-02  | Ícono con nombre vacío o `undefined` muestra SVG vacío pero sin indicador visual de error | Ajuste estético · Edge case menor | **D** | Opcional |

---

## Plan de Mitigación — Riesgos ALTO

### R-001: Regresión masiva por tokens.scss

- **Descripción:** Un valor incorrecto en `tokens.scss` (ej. variable de densidad, color semántico) propaga errores visuales a los 12 átomos simultáneamente sin que ningún test unitario lo detecte.
- **Mitigación:**
  - Validar estructura del archivo con un linter CSS (StyleLint con custom properties)
  - Prueba de regresión visual con captura de pantalla en los 4 temas × 3 densidades antes de cada merge a `develop`
  - Revisión de pares obligatoria para cualquier cambio en `tokens.scss`
- **Tests obligatorios:**
  - Prueba visual automatizada (Playwright/Selenium): renderizar un átomo con cada combinación de `data-theme` × `data-density` × `data-primary`
  - Verificar que las custom properties se resuelven con valores no nulos en cada contexto
- **Bloqueante para release:** ✅ Sí

---

### R-002: XSS via DomSanitizer en IconComponent

- **Descripción:** `IconComponent` llama a `bypassSecurityTrustHtml()` para inyectar SVG paths. Si el catálogo de íconos fuera modificado con contenido malicioso (o se permitiera `@Input() name` de usuario externo sin validación), se abre un vector XSS.
- **Mitigación:**
  - El catálogo `ICONS` es una constante TypeScript en tiempo de compilación — no aceptar rutas SVG por `@Input()` dinámico
  - El tipo `IconName` es un string literal union exhaustivo — TypeScript rechaza en compilación valores fuera del catálogo
  - No exponer un `@Input()` de tipo `string` genérico para la ruta SVG
- **Tests obligatorios:**
  - Verificar que el componente solo acepta valores del tipo `IconName` (validado en compilación)
  - Test de integración: pasar un string que no esté en el catálogo y verificar que el SVG queda vacío (sin paths)
- **Bloqueante para release:** ✅ Sí

---

### R-003: ControlValueAccessor rompe formularios del cotizador

- **Descripción:** `InputComponent`, `SelectComponent`, `TextareaComponent` y `SwitchComponent` implementan `ControlValueAccessor`. Si `writeValue`, `registerOnChange` o `setDisabledState` no funcionan correctamente, todos los formularios reactivos del cotizador (general-info, locations, coverages) quedarán sin datos o con estado inconsistente.
- **Mitigación:**
  - Tests de integración de `ControlValueAccessor` para los 4 componentes (no son tests de componente Angular, sino tests de la interfaz del contrato)
  - Verificar que `FormControl.setValue()` actualiza visualmente el control
  - Verificar que cambios en el control actualizan el `FormControl`
  - Verificar que `setDisabledState(true)` deshabilita la interacción
- **Tests obligatorios:**
  - Test unitario del ciclo completo CVA: `writeValue → render → user input → onChange`
  - Test de estado deshabilitado para los 4 controles
- **Bloqueante para release:** ✅ Sí

---

## Riesgos Medio — Acciones Recomendadas

| ID | Acción recomendada |
|----|-------------------|
| R-004 | Ejecutar auditoría de accesibilidad con axe-core o Lighthouse sobre `SwitchComponent` |
| R-005 | Verificar manualmente que el botón no emite eventos cuando `disabled=true` y `aria-disabled=true` |
| R-006 | Incluir prueba de estado desconocido en los escenarios Gherkin del QA |
| R-007 | Probar visualmente los 3 valores de `data-density` sobre los átomos de formulario |
| R-008 | El test unitario `sparkline.utils.spec.ts` ya cubre el clamp — verificar que está en el pipeline CI |
| R-009 | TypeScript strict mode previene tones inválidos en compilación — documentar como mitigado |

---

## Clasificación por Componente

| Componente | Nivel máximo | Razón principal |
|------------|-------------|-----------------|
| `tokens.scss` | **A** | Regresión transversal a todos los átomos |
| `IconComponent` | **A** | DomSanitizer + innerHTML |
| `InputComponent` | **A** | ControlValueAccessor crítico para formularios |
| `SelectComponent` | **A** | ControlValueAccessor crítico para formularios |
| `TextareaComponent` | **A** | ControlValueAccessor crítico para formularios |
| `SwitchComponent` | **A** | ControlValueAccessor + WCAG obligatorio |
| `BtnComponent` | **S** | Estado disabled en flujos de formulario |
| `StatusBadgeComponent` | **S** | Estado desconocido sin crash |
| `FieldComponent` | **S** | Prioridad error > help |
| `SparklineComponent` | **S** | Clamp matemático (ya cubierto con test) |
| `BadgeComponent` | **D** | Presentacional puro, sin lógica |
| `SectionHeaderComponent` | **D** | Layout estético |
| `StatCardComponent` | **D** | TypeScript strict mitiga riesgo de tone inválido |
