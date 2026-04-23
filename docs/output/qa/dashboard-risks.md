# Análisis de Riesgos ASD — Dashboard de Folios (SPEC-004)

**Feature:** Dashboard — Panel de Inventario de Folios  
**Spec:** SPEC-004 · `status: IMPLEMENTED`  
**Fecha de análisis:** 2026-04-22  
**Analista:** risk-identifier skill

---

## Resumen

| Total | Alto (A) — Obligatorio | Medio (M) — Recomendado | Bajo (B) — Opcional |
|-------|----------------------|------------------------|---------------------|
| 12    | 4                    | 5                      | 3                   |

---

## Tabla de Riesgos Clasificados por Prioridad

| ID    | HU           | Descripción del Riesgo                                                              | Factor ASD                          | Nivel | Testing       |
|-------|--------------|-------------------------------------------------------------------------------------|-------------------------------------|-------|---------------|
| R-001 | HU-01        | `USE_MOCK_FOLIOS` tiene `factory: () => true` en el token `providedIn: 'root'` sin override en `app.config.ts`, lo que garantiza que el mock llegue a producción si no se sobrescribe explícitamente | Integración externa — mock activo por defecto | **A** | Obligatorio |
| R-002 | HU-01        | El endpoint `GET /v1/folios` no existe en el backend; si se desactiva el mock en producción sin implementar el endpoint, el dashboard queda completamente roto (pantalla en error permanente) | Integración con sistema externo sin contrato firmado | **A** | Obligatorio |
| R-003 | HU-04        | `router.navigate(['/quotes', folioNumber, 'general-info'])` usa el `folioNumber` del mock tal como viene del servicio, sin validación de formato ni existencia. Un `folioNumber` vacío, nulo o malformado genera una ruta inválida sin feedback al usuario | Flujo crítico — navegación sin validación | **A** | Obligatorio |
| R-004 | HU-01 / SPEC | Colisión de nombres: existe `FolioService` en `core/services/folio.service.ts` (crea folios vía POST) y `FolioListService` en `features/cotizador/services/folio.service.ts` (lista folios). Mismo nombre de archivo, clases con responsabilidades distintas. Un import erróneo silencioso rompe funcionalidad sin error de compilación | Componente con múltiples dependencias — riesgo de confusión | **A** | Obligatorio |
| R-005 | HU-01        | La lógica de carga usa `ngOnInit` + `subscribe` manual (con `takeUntilDestroyed`) en lugar del patrón `async pipe` recomendado en la spec. El método `retry()` crea una segunda suscripción sin cancelar la anterior si se llama repetidamente; ante fallos consecutivos pueden acumularse suscripciones activas | Lógica de negocio compleja — manejo de estado async | **M** | Recomendado |
| R-006 | HU-02        | Filtrado 100% client-side sobre el array completo cargado inicialmente. Si `GET /v1/folios` retorna un volumen alto (cientos de folios), cada pulsación de teclado ejecuta `filterFolios` sobre el array completo. No hay debounce en la lógica del servicio ni en el componente de filtros | Alta frecuencia de uso — rendimiento en escenarios reales | **M** | Recomendado |
| R-007 | HU-01 / HU-02 | StatCards calculadas del total pero el usuario ve el resultado filtrado en la tabla. La inconsistencia visual es una decisión de negocio documentada en la spec (CRITERIO-2.1), pero puede percibirse como un bug por usuarios nuevos. No hay indicador visual que comunique esta diferencia | Funcionalidad de alta frecuencia — UX confusa | **M** | Recomendado |
| R-008 | HU-04        | La ruta del router es `/quotes/:folioNumber/general-info` pero en `cotizador.routes.ts` el parámetro se llama `:folio` (`path: 'quotes/:folio'`). La navegación funciona porque Angular solo importa el segmento de ruta, pero el parámetro que lee `GeneralInfoPage` es `folio`, no `folioNumber`, creando una asimetría semántica que puede generar bugs al leer el parámetro | Código nuevo sin historial — discrepancia de nomenclatura | **M** | Recomendado |
| R-009 | HU-05        | `NewFolioModalComponent` siempre está montado en el DOM (`<app-new-folio-modal [isOpen]="isModalOpen">`), independientemente de si `isModalOpen` es true o false. Dependiendo de cómo el componente gestione sus suscripciones y peticiones HTTP internas, puede haber efectos secundarios no deseados al cargar el dashboard | Componente con múltiples dependencias | **M** | Recomendado |
| R-010 | HU-02 / HU-03 | Los controles visuales sin funcionalidad (checkboxes de selección múltiple, botón "Más filtros", botón "Exportar", menú contextual por fila) están renderizados activos en UI pero sin lógica. No hay indicador visual de que están deshabilitados; el usuario puede intentar usarlos repetidamente, generando confusión y reportes de bug | Ajuste estético/funcional — impacto en UX | **B** | Opcional |
| R-011 | HU-01        | El dato `completionPct` se muestra vía `SparklineComponent` pero la spec indica que "lo calcula el backend". En modo mock, los valores son hardcodeados (10, 60, 85, 100, 45). Si el algoritmo de cálculo del backend difiere, las pruebas QA contra el mock no detectarán discrepancias de progreso | Features internas — datos mock no representativos | **B** | Opcional |
| R-012 | HU-01        | El template usa `@if` / `@else if` blocks de Angular 17+ (control flow syntax). Si el proyecto tiene configurada una versión de compilación anterior o se ejecuta en un browser con problemas de polyfills, podría fallar silenciosamente | Refactorización sin cambio de lógica — compatibilidad | **B** | Opcional |

---

## Riesgos ALTO — Plan de Mitigación Concreto

### R-001: Mock activo en producción por `factory: () => true`

**Descripción detallada:**  
El `InjectionToken` `USE_MOCK_FOLIOS` está declarado con `providedIn: 'root'` y `factory: () => true`. Esto significa que en cualquier build (incluido el de producción) el token resuelve a `true` a menos que se sobrescriba explícitamente. El archivo `app.config.ts` revisado **no contiene ningún override** del token. No hay archivo `environment.prod.ts` que cambie este valor.

**Impacto:**  
En producción, `FolioListService.listFolios()` retorna siempre los 5 folios mock hardcodeados. El usuario nunca ve datos reales. Además, el endpoint real `GET /v1/folios` jamás se llega a invocar, con lo que los errores de integración quedan ocultos indefinidamente.

**Mitigación recomendada:**

1. Agregar el override en `app.config.ts` usando la lógica del entorno:
   ```typescript
   // app.config.ts
   import { USE_MOCK_FOLIOS } from './features/cotizador/services/folio.service';
   import { isDevMode } from '@angular/core';

   providers: [
     // ... resto de providers
     { provide: USE_MOCK_FOLIOS, useValue: isDevMode() },
   ]
   ```
2. Alternativamente, crear `environment.ts` / `environment.prod.ts` y enlazar el valor del token al flag de entorno.
3. Cambiar el valor por defecto del factory a `false` y activarlo solo en providers de prueba/dev.

**Tests obligatorios:**
- Test e2e/integración que valide que en el build de producción se invoca `GET /v1/folios` (no el mock).
- Test unitario que verifique que con `USE_MOCK_FOLIOS = false` se ejecuta la rama HTTP.

**Bloqueante para release:** Sí

---

### R-002: Endpoint `GET /v1/folios` no implementado en backend

**Descripción detallada:**  
La spec confirma explícitamente que el endpoint no existe aún (`api-contracts.md` no lo incluye). El frontend depende completamente de él para mostrar datos reales. No hay contrato formal acordado con el equipo backend ni fecha de entrega.

**Impacto:**  
Al desactivar el mock (una vez resuelto R-001), el dashboard mostrará el estado de error permanentemente hasta que el backend entregue el endpoint. Esto bloquea QA funcional con datos reales y el flujo end-to-end completo.

**Mitigación recomendada:**

1. Formalizar el contrato en `docs/api-contracts.md` con el equipo backend inmediatamente (método, ruta, request, response 200/401/500, paginación futura).
2. Crear un interceptor HTTP de desarrollo (`folios-mock.interceptor.ts`) separado del service — más limpio y fácil de desactivar que el `InjectionToken`.
3. Establecer una fecha de entrega del endpoint como dependencia bloqueante para el release del dashboard.
4. Añadir contrato de validación (p.ej., Pact) entre el contrato definido en la spec y la implementación backend.

**Tests obligatorios:**
- Test de integración del `FolioListService` contra el endpoint real (con backend en ejecución).
- Test e2e que cubra el happy path CRITERIO-1.1 con datos del backend.

**Bloqueante para release:** Sí

---

### R-003: Navegación con `folioNumber` sin validación

**Descripción detallada:**  
`onFolioClick(folioNumber: string)` llama directamente a `this.router.navigate(['/quotes', folioNumber, 'general-info'])`. El `folioNumber` proviene del array `folios[]` tal como lo retorna el servicio. Si el backend retorna un folio con `folioNumber: ''`, `folioNumber: null` (ruptura de contrato), o caracteres especiales (`/`, `?`, `#`), la URL generada puede:
- Crear rutas inválidas (`/quotes//general-info`)
- Romper el router de Angular
- Generar peticiones a endpoints inválidos desde `GeneralInfoPage`

**Impacto:**  
Navegación silenciosamente errónea o crash del router sin mensaje de error al usuario.

**Mitigación recomendada:**

1. Agregar guard en `onFolioClick`:
   ```typescript
   protected onFolioClick(folioNumber: string): void {
     if (!folioNumber?.trim()) {
       console.error('Invalid folioNumber — navigation aborted');
       return;
     }
     this.router.navigate(['/quotes', folioNumber, 'general-info']);
   }
   ```
2. Validar en el modelo `FolioSummary` que `folioNumber` sea non-empty (p.ej. con una función de validación en el service que filtre folios inválidos).
3. Verificar que `GeneralInfoPage` maneje el caso de parámetro de ruta vacío o inválido con un redirect o mensaje de error.

**Tests obligatorios:**
- Test unitario de `onFolioClick` con `folioNumber` vacío, nulo y con caracteres especiales.
- Test e2e de navegación desde tabla y cuadrícula (CRITERIO-4.1, CRITERIO-4.2).

**Bloqueante para release:** Sí

---

### R-004: Colisión de nombres entre `FolioService` y `FolioListService`

**Descripción detallada:**  
Existen dos archivos con el mismo nombre en rutas distintas:
- `src/app/core/services/folio.service.ts` → exporta `FolioService` (POST /v1/folios — crea folios)
- `src/app/features/cotizador/services/folio.service.ts` → exporta `FolioListService` (GET /v1/folios — lista folios)

El nombre de archivo es idéntico (`folio.service.ts`). Un IDE con autoimport puede resolver el import al servicio incorrecto sin error de compilación, ya que ambos son injectable y TypeScript puede confundir las interfaces si se importan tipos del archivo equivocado. En la `CotizadorDashboardPage` el import actualmente apunta al correcto (`FolioListService`), pero la deuda de nomenclatura es un riesgo activo en refactorizaciones futuras.

**Impacto:**  
Un import erróneo en un componente que llame a `FolioService` en lugar de `FolioListService` inyectará el servicio de creación en lugar del de listado, produciendo errores HTTP silenciosos (se haría POST en lugar de GET) difíciles de rastrear.

**Mitigación recomendada:**

1. Renombrar el archivo del feature a `folio-list.service.ts` y la clase a `FolioListService` (ya tiene el nombre correcto) para alinear nombre de clase y nombre de archivo.
2. Actualizar el import en `cotizador-dashboard.page.ts` y `folio.service.spec.ts` del feature.
3. Agregar una regla ESLint o lint personalizada que prohíba dos archivos con el mismo nombre en rutas distintas del mismo proyecto.

**Tests obligatorios:**
- Verificar manualmente que todos los imports del proyecto apuntan al service correcto tras el renombrado.
- Test unitario que confirme que `FolioListService` hace GET y `FolioService` hace POST (evitar regresiones cruzadas).

**Bloqueante para release:** Sí (riesgo latente de regresión inmediata en refactorizaciones)

---

## Riesgos MEDIO — Acciones Recomendadas

| ID    | Acción recomendada |
|-------|--------------------|
| R-005 | Extraer la lógica de suscripción en un método privado para reutilizarla en `ngOnInit` y `retry()`. Agregar debounce o `switchMap` para evitar suscripciones paralelas al reintentar. |
| R-006 | Agregar `debounceTime(200)` en el `filtersChange` output o en el `FolioFiltersComponent` para reducir la frecuencia de ejecución del filtrado. Documentar el límite de folios soportado (p.ej. ≤ 500). |
| R-007 | Agregar un texto explicativo junto a las StatCards: "Las métricas reflejan el total de tu portafolio" para comunicar la intención de negocio. |
| R-008 | Renombrar el parámetro de ruta de `:folio` a `:folioNumber` en `cotizador.routes.ts` para alinear la nomenclatura en toda la capa de routing. Actualizar todos los `ActivatedRoute.params['folio']` a `'folioNumber'`. |
| R-009 | Cambiar `<app-new-folio-modal>` a renderizado condicional con `@if (isModalOpen)` en lugar de siempre estar montado. |

---

## Riesgos BAJO — Backlog Opcional

| ID    | Acción sugerida |
|-------|--------------------|
| R-010 | Deshabilitar visualmente los controles sin funcionalidad (cursor `not-allowed`, color muted, tooltip "Próximamente") o eliminarlos del template hasta que se implemente la lógica real. |
| R-011 | Documentar en la spec que los valores mock de `completionPct` son aproximaciones y que QA debe validar el cálculo real contra el backend. |
| R-012 | Verificar en el pipeline CI que la versión de Angular target compile correctamente con la sintaxis `@if` / `@else if`. |

---

## Conclusión: ¿El feature es apto para QA funcional?

**No apto para QA funcional en su estado actual.**

El feature está bloqueado por 4 riesgos de nivel Alto que deben resolverse antes de iniciar QA funcional:

1. **R-001** y **R-002** en conjunto impiden probar cualquier escenario con datos reales. Actualmente solo es posible QA sobre el mock hardcodeado, lo que no valida la integración real y puede ocultar defectos de contrato (tipos de datos, valores nulos, paginación futura).

2. **R-003** impide validar el flujo crítico de HU-04 (CRITERIO-4.1, CRITERIO-4.2) ante datos inesperados, que es una de las funcionalidades de más alta prioridad del dashboard.

3. **R-004** representa una deuda técnica activa que puede generar regresiones inmediatas en el siguiente sprint de desarrollo, dificultando la estabilidad del ambiente de QA.

**Condición mínima para iniciar QA funcional:**
- R-001 resuelto (mock desactivado en producción) ✗
- R-002 resuelto o mitigado con un interceptor de desarrollo controlado ✗
- R-003 resuelto (validación de `folioNumber`) ✗
- R-004 resuelto (renombrado del archivo) ✗

Una vez resueltos los 4 riesgos Alto, el feature puede entrar a QA funcional cubriendo los criterios CRITERIO-1.1 al CRITERIO-5.1. Los riesgos Medio (R-005 a R-009) pueden resolverse en paralelo al ciclo de QA sin bloquearlo.
