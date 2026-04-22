---
name: implement-frontend
description: Implementa un feature completo en el frontend con Angular 19 + Atomic Design. Requiere spec con status APPROVED en .claude/specs/.
argument-hint: "<nombre-feature>"
---

# Implement Frontend

## Prerequisitos

Lee en paralelo antes de implementar:

```
CLAUDE.md
.claude/rules/frontend.md
.claude/docs/lineamientos/dev-guidelines.md
.claude/specs/<feature>.spec.md
docs/api-contracts.md
```

Obtén la lista de issues abiertas del feature y guárdala en memoria de trabajo:

```bash
gh issue list --state open --limit 100
```

Busca en esa lista los títulos que correspondan a las tareas del `## 3. LISTA DE TAREAS` de la spec.
Cada tarea que implementes debe cerrar su issue correspondiente **en el momento en que la tarea queda terminada**, no al final.

## Orden de implementación

Seguir la jerarquía de Atomic Design — cada nivel depende del anterior:

```
models/interfaces → services (TDD) → guards/pipes (TDD) → atoms → molecules → organisms → templates → pages → registrar ruta
```

| Capa | Carpeta | Responsabilidad | Tests |
|------|---------|-----------------|-------|
| **Models** | `<feature>/models/` | Interfaces TypeScript del dominio | No |
| **Services** | `<feature>/services/` | Llamadas HTTP al backend | **TDD obligatorio** |
| **Guards / Pipes** | `core/guards/`, `shared/pipes/` | Navegación, transformaciones | **TDD obligatorio** |
| **Atoms** | `shared/ui/atoms/` | Elemento UI mínimo (`@Input`/`@Output`) | No |
| **Molecules** | `shared/ui/molecules/` | Composición de 2-5 átomos | No |
| **Organisms** | `shared/ui/organisms/` o `<feature>/components/` | Sección UI compleja | No |
| **Templates** | `shared/ui/templates/` | Layout con `<ng-content>`, sin data real | No |
| **Pages** | `<feature>/pages/` | Instancia de template con data real | No |

## TDD para services y guards

Aplicar el ciclo RED → GREEN → REFACTOR:

```
a) Crear <feature>.service.spec.ts — ver plantilla en templates/service.spec.ts
b) Escribir el test del método → ng test → confirmar RED
c) Crear <feature>.service.ts con el método
d) ng test → confirmar GREEN
e) Refactorizar si aplica
f) Repetir para el siguiente método
```

## Patrones obligatorios

- `environment.apiUrl` para URL base — nunca hardcodear
- `inject()` para inyección de dependencias
- Standalone components — sin NgModules
- `async pipe` o `takeUntilDestroyed()` para suscripciones en componentes
- `@Input()` y `@Output()` para comunicación entre componentes (no state global en atoms/molecules)
- Control flow moderno (`@if`, `@for`) en templates — no `*ngIf` ni `*ngFor`

## Restricciones

- Solo trabajar en `Insurance-Quoter-Front/`.
- Los atoms no importan otros componentes del proyecto (solo Angular core).
- Las molecules solo importan atoms.
- Los organisms importan atoms y molecules; pueden emitir eventos hacia la page.
- Las pages son los únicos componentes que inyectan services.
- Contratos de API en `docs/api-contracts.md` como referencia — no inventar endpoints.

## Cierre de issues

Al terminar **cada tarea individual** del checklist de la spec:

1. Identificar el número de issue por coincidencia de título con la tarea.
2. Cerrar inmediatamente con evidencia del archivo implementado:

```bash
gh issue close <N> --comment "Implementado: <ruta/archivo.ts>. Build limpio."
```

3. Marcar la tarea como `[x]` en la spec.

**Regla:** una tarea = un issue cerrado = un `[x]` en la spec. No acumular cierres para el final.

Si no existe issue para una tarea (fue omitida en `tasks-to-issues`), continuar sin crearla.

## Templates de referencia

```
.claude/skills/implement-frontend/templates/
├── atom.component.ts      ← estructura base de un atom
├── atom.component.html
├── organism.component.ts  ← estructura base de un organism/feature component
├── page.component.ts      ← estructura base de una page
├── page.component.html
└── page.component.scss
```
