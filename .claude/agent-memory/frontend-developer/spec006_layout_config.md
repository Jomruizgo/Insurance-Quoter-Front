---
name: SPEC-006 layout-config implementation
description: Layout config feature implementation state — service TDD complete, issues #106-#112 closed, build clean
type: project
---

SPEC-006 (quote-layout-config) implementado el 2026-04-22. Issues #106-#112 cerrados.

Archivos creados:
- `src/app/features/cotizador/models/layout-config.model.ts`
- `src/app/features/cotizador/services/layout-config.service.spec.ts` (6 tests, 100% cobertura)
- `src/app/features/cotizador/services/layout-config.service.ts`
- `src/app/features/cotizador/components/layout-config-form/layout-config-form.component.ts`
- `src/app/features/cotizador/components/layout-config-form/layout-config-form.component.html`
- `src/app/features/cotizador/components/layout-config-form/layout-config-form.component.scss`
- `src/app/features/cotizador/pages/layout.page.ts` (reemplazó stub)
- `src/app/features/cotizador/pages/layout.page.html`
- `src/app/features/cotizador/pages/layout.page.scss`

**Why:** El service usa AppConfigService (no environment.ts directamente) — patrón establecido en general-info.service.ts.

**How to apply:** Para nuevos services en cotizador, usar `inject(AppConfigService)` y `this.config.apiUrl` en lugar de `environment.apiUrl`. El stepper actualiza su estado desde el backend; MainLayoutComponent recarga QuoteState al montar — no hay refresh automático tras navegaciones internas.
