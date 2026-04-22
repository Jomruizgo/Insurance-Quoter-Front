---
description: Reglas de frontend para este proyecto (Angular 19 + TypeScript + RxJS). Se aplica automáticamente a archivos frontend.
paths:
  - "Insurance-Quoter-Front/**"
  - "cotizador-danos-web/**"
---

# Reglas de Frontend — Angular 19 + TypeScript

## Stack aprobado

- **Angular 19** (última versión estable) con **TypeScript 5.x**
- **Angular Router** — rutas de la SPA
- **Angular HttpClient** — llamadas HTTP al backend
- **RxJS** — manejo reactivo de datos y observables
- **Angular Forms** — `ReactiveFormsModule` para formularios complejos
- **Standalone Components** — arquitectura sin NgModules (Angular 19 default)

**Prohibido:** React, Vue, jQuery, fetch directo en componentes, llamadas HTTP fuera de services, NgModules salvo integración con librerías legacy.

## Idioma

| Artefacto | Idioma |
|-----------|--------|
| Clases, métodos, variables, interfaces, archivos | **Inglés** |
| Comentarios de código (`//`) | **Inglés** |
| Documentación (specs, README, markdown) | **Español** |
| Textos de la interfaz de usuario (labels, botones, mensajes, placeholders) | **Español** |

Los textos que el usuario ve en pantalla van en español (ej. `"Crear cotización"`, `"Código postal inválido"`). Los términos internacionales comunes se mantienen en inglés (ej. "online", "dashboard", "folio").

## Metodología: TDD para lógica

Se aplica **TDD (Test-Driven Development)** en la capa de lógica del frontend:

```
1. Escribir el test del service / guard / pipe (RED)
2. Implementar el mínimo código que lo haga pasar (GREEN)
3. Refactorizar manteniendo tests en verde (REFACTOR)
```

**Qué se testea con TDD:**
- ✅ Services (`*.service.ts`) — llamadas HTTP, transformaciones, lógica de negocio
- ✅ Guards (`*.guard.ts`) — lógica de navegación y control de acceso
- ✅ Pipes (`*.pipe.ts`) — transformaciones de datos
- ✅ Resolvers y funciones utilitarias puras

**Qué NO se testea:**
- ❌ Componentes y templates (HTML/SCSS) — no se prueban interacciones de UI
- ❌ Páginas (route components) — no se prueban renders ni bindings

La razón es maximizar ROI: la lógica de negocio en services es estable y crítica; los templates cambian con frecuencia y su valor de test es bajo.

## Atomic Design — Estructura de Componentes

El frontend sigue **Atomic Design** para organizar los componentes de UI en cinco niveles de complejidad creciente.

| Nivel | Carpeta | Descripción | Ejemplos |
|-------|---------|-------------|----------|
| **Atoms** | `shared/ui/atoms/` | Elemento UI mínimo, sin dependencias internas de componentes | `ButtonComponent`, `InputComponent`, `LabelComponent`, `SpinnerComponent` |
| **Molecules** | `shared/ui/molecules/` | Composición de 2-5 átomos con comportamiento propio | `FormFieldComponent`, `SelectInputComponent`, `AlertMessageComponent` |
| **Organisms** | `shared/ui/organisms/` | Sección de UI compleja que combina moléculas | `QuoteHeaderComponent`, `LocationCardComponent`, `CoverageTableComponent` |
| **Templates** | `shared/ui/templates/` | Layout estructural sin data real; define slots con `<ng-content>` | `QuoteLayoutComponent`, `WizardLayoutComponent` |
| **Pages** | `features/<feature>/pages/` | Instancia de un template con data real del service | `GeneralInfoPage`, `LocationsPage` |

### Reglas de composición

- Los **átomos** solo importan módulos Angular core (`CommonModule`, `FormsModule`). No importan otros componentes del proyecto.
- Las **moléculas** solo importan átomos.
- Los **organismos** importan átomos y moléculas; pueden tener lógica local mínima (`@Output` de eventos, estado de visibilidad).
- Los **templates** definen layout con `<ng-content select="...">` y no contienen lógica de negocio.
- Las **pages** consumen services vía `inject()`, componen organisms y templates, y son los componentes de ruta.

### Componentes de feature vs. shared

- Reutilizable en más de un feature → `shared/ui/molecules/` u `organisms/`
- Exclusivo de un feature → `features/<feature>/components/`

## Arquitectura por Capas

```
services (TDD) → atoms → molecules → organisms → templates → pages (route components)
```

| Capa | Carpeta | Responsabilidad | Prohibido |
|------|---------|----------------|-----------|
| `services/` | `<feature>/services/` o `core/services/` | Llamadas HTTP (HttpClient), transformación de datos | Estado de UI, lógica de render |
| `models/` | `shared/models/` o `<feature>/models/` | Interfaces y tipos TypeScript del dominio | Lógica de negocio, HTTP |
| `atoms/` | `shared/ui/atoms/` | UI mínima (`@Input`, `@Output`), sin dependencias internas | Importar otros componentes del proyecto |
| `molecules/` | `shared/ui/molecules/` | Composición de átomos | Importar organisms, llamadas HTTP |
| `organisms/` | `shared/ui/organisms/` o `<feature>/components/` | Composición de moléculas + átomos, lógica de presentación | Llamadas HTTP directas |
| `templates/` | `shared/ui/templates/` | Layout con `<ng-content>`, sin lógica | Lógica de negocio, HTTP |
| `pages/` | `features/<feature>/pages/` | Composición final + data real del service | Llamadas HTTP directas (siempre vía service) |

## Convenciones Obligatorias

- **Tipado estricto**: `strict: true` en `tsconfig.json` — cero `any` sin justificación
- **Inyección de dependencias**: siempre con `inject()` o constructor DI — sin instanciación manual de servicios
- **HttpClient**: SIEMPRE en services, NUNCA en componentes directamente
- **Observables**: retornar `Observable<T>` desde services; suscribir en componentes con `async pipe` preferentemente
- **Variables de entorno**: usar `environment.ts` / `environment.prod.ts` para URLs y configuración
- **API base URL**: `environment.apiUrl` — nunca hardcodear URLs

## Llamadas a la API (patrón obligatorio)

```typescript
// services/cotizacion.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1`;

  crearFolio(): Observable<FolioResponse> {
    return this.http.post<FolioResponse>(`${this.baseUrl}/folios`, {});
  }
}
```

## Rutas del cotizador

```
/cotizador                           → selección / creación de folio
/quotes/:folio/general-info          → datos generales
/quotes/:folio/locations             → ubicaciones
/quotes/:folio/technical-info        → info técnica y coberturas
/quotes/:folio/terms-and-conditions  → cálculo y resultados
```

## Nomenclatura de Archivos

| Artefacto | Convención | Ejemplo |
|-----------|-----------|---------|
| Componente | `<feature>.component.ts` + `.html` + `.scss` | `cotizacion-form.component.ts` |
| Service | `<feature>.service.ts` | `cotizacion.service.ts` |
| Model/Interface | `<feature>.model.ts` | `cotizacion.model.ts` |
| Guard | `<feature>.guard.ts` | `folio-activo.guard.ts` |
| Module/Route | `<feature>.routes.ts` | `cotizador.routes.ts` |
| Test | `<clase>.spec.ts` | `cotizacion.service.spec.ts` |

- `kebab-case` para nombres de archivo
- `PascalCase` para clases (`CotizacionFormComponent`)
- `camelCase` para variables, métodos y propiedades

## Estructura de Referencia

```
Insurance-Quoter-Front/src/
├── app/
│   ├── core/
│   │   ├── services/          ← servicios singleton (http, auth) — TDD obligatorio
│   │   └── models/            ← interfaces de dominio compartidas
│   ├── shared/
│   │   └── ui/
│   │       ├── atoms/         ← Button, Input, Label, Spinner, Badge, Icon
│   │       ├── molecules/     ← FormField, SelectInput, AlertMessage, SearchBar
│   │       ├── organisms/     ← QuoteHeader, LocationCard, CoverageTable, NavBar
│   │       └── templates/     ← QuoteLayout, MainLayout (layout sin data real)
│   └── features/
│       ├── cotizador/         ← feature principal
│       │   ├── pages/         ← instancias de templates con data real
│       │   ├── components/    ← organisms exclusivos de este feature
│       │   ├── services/      ← TDD obligatorio
│       │   ├── models/        ← interfaces del feature
│       │   └── cotizador.routes.ts
│       └── ...
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── main.ts
```

## Anti-patrones Prohibidos

- `HttpClient` directamente en componentes (siempre en services)
- Hardcodear URLs de API (usar `environment.apiUrl`)
- Subscribir observables sin `async pipe` o sin `takeUntilDestroyed()`
- Usar `any` sin comentario justificando la excepción
- Lógica de negocio en componentes (va en services)
- Módulos de Angular si el proyecto usa standalone components (preferir standalone)

## Lineamientos completos

`.claude/docs/lineamientos/dev-guidelines.md` — Clean Code, SOLID, API REST, Seguridad, Observabilidad.
