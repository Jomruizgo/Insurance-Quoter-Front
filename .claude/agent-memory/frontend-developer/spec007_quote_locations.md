---
name: SPEC-007 quote-locations IMPLEMENTED
description: Feature quote-locations completamente implementado — 3 servicios con TDD, 8 componentes, 70/70 tests, build limpio
type: project
---

SPEC-007 quote-locations fue implementado el 2026-04-22. Status: IMPLEMENTED.

**Why:** Paso 3 del wizard de cotización. Permite registrar y editar ubicaciones de riesgo con validación en tiempo real y persistencia PATCH optimista.

**How to apply:** Al tocar LocationService, ZipCodeService o CatalogService.obtenerGiros(), verificar que los specs TDD siguen en verde. La ruta /quotes/:folioNumber/locations usa LocationsPageComponent (no el viejo LocationsPage placeholder).

Decisiones clave:
- El proyecto usa AppConfigService (no environment.ts) — usar `config.apiUrl` y `config.coreUrl`
- BusinessLine vive en `core/models/catalog.model.ts` como fuente canónica; `features/cotizador/models/catalog.model.ts` lo re-exporta con `export type`
- CatalogService.obtenerGiros() se añadió al service existente en `core/services/` (no se creó uno nuevo en features)
- LocationDrawerComponent gestiona su propio FormGroup con subgrupos por pestaña (basicData, construction, businessLine, guaranteesGroup)
- El viejo `pages/locations.page.ts` (placeholder) fue reemplazado por `pages/locations/locations-page.component.ts`
- cotizador.routes.ts: la ruta 'locations' ahora apunta a LocationsPageComponent

Issues cerrados: #119–#147 (todos)
Cobertura: Statements 93.49%, Branches 86.36%, Functions 87.17%, Lines 93.57%
