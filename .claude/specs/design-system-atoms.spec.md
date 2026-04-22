---
id: SPEC-001
status: IMPLEMENTED
feature: design-system-atoms
created: 2026-04-22
updated: 2026-04-22
author: spec-generator
version: "1.0"
related-specs: []
---

# Spec: Sistema de Diseño — Átomos (Design System Atoms)

> **Estado:** `DRAFT` → aprobar con `status: APPROVED` antes de iniciar implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción

Define e implementa todos los bloques de construcción visuales reutilizables (nivel Atom de Atomic Design) del cotizador de seguros. Incluye el sistema de tokens de diseño (variables CSS), once componentes Angular 19 standalone y los tipos TypeScript que los contratan. Sin este sistema base ningún otro feature de UI puede implementarse.

### Requerimiento de Negocio

Sistema de diseño base (nivel Atom de Atomic Design) que define todos los bloques de construcción visuales reutilizables del cotizador. Sin este sistema, ningún otro feature de UI puede implementarse.

### Historias de Usuario

---

#### HU-01: Sistema de tokens de diseño

```
Como:        Desarrollador frontend del cotizador
Quiero:      Un archivo de tokens CSS (custom properties) que centralice colores, tipografía, espaciado, sombras y densidades
Para:        Garantizar consistencia visual en todos los componentes y facilitar el cambio de tema o densidad sin modificar cada componente individualmente

Prioridad:   Alta
Estimación:  S
Dependencias: Ninguna
Capa:        Frontend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Tokens disponibles en todos los componentes
  Dado que:  el archivo tokens.scss está importado en styles.scss global de Angular
  Cuando:    cualquier componente átomo usa una custom property (ej. var(--brand-500))
  Entonces:  el valor se resuelve correctamente en tiempo de render sin errores CSS
```

```gherkin
CRITERIO-1.2: Cambio de tema claro/oscuro
  Dado que:  el atributo data-theme="dark" está en el elemento <html> o en un contenedor padre
  Cuando:    el usuario visualiza cualquier átomo
  Entonces:  los tokens semánticos (--bg, --surface, --text, --border) toman sus valores de tema oscuro definidos en tokens.scss
```

```gherkin
CRITERIO-1.3: Cambio de densidad
  Dado que:  el atributo data-density="compact" | "standard" | "cozy" está en el elemento raíz
  Cuando:    el usuario visualiza entradas, botones o tarjetas
  Entonces:  las variables --input-h, --btn-h, --row-h y --pad-card toman los valores correspondientes a esa densidad
```

```gherkin
CRITERIO-1.4: Color primario intercambiable
  Dado que:  el atributo data-primary="lime" | "teal" | "indigo" | "amber" está en el elemento raíz
  Cuando:    el usuario visualiza cualquier átomo que use var(--brand-500)
  Entonces:  el color del acento cambia según la paleta seleccionada sin recargar la página
```

**Edge Case**
```gherkin
CRITERIO-1.5: Tokens sin tema explícito
  Dado que:  no hay atributo data-theme ni data-density en el árbol DOM
  Cuando:    se renderiza cualquier átomo
  Entonces:  los tokens usan los valores por defecto (tema claro, densidad standard) definidos en :root
```

---

#### HU-02: Componente IconComponent

```
Como:        Desarrollador frontend
Quiero:      Un componente Angular que renderice íconos SVG inline del catálogo de diseño
Para:        Mostrar íconos coherentes con el sistema de diseño en cualquier parte de la UI sin depender de fuentes de íconos externas

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Renderizar ícono por nombre
  Dado que:  el componente recibe @Input() name="search"
  Cuando:    se renderiza en pantalla
  Entonces:  se muestra el SVG correspondiente al ícono "search" con los atributos viewBox, fill="none" y stroke="currentColor"
```

```gherkin
CRITERIO-2.2: Tamaño y grosor de trazo configurables
  Dado que:  el componente recibe @Input() size=20 y @Input() stroke=2.0
  Cuando:    se renderiza
  Entonces:  el SVG tiene width=20, height=20 y stroke-width=2.0
```

**Edge Case**
```gherkin
CRITERIO-2.3: Nombre de ícono no existente en catálogo
  Dado que:  el componente recibe @Input() name="icono-inexistente"
  Cuando:    se renderiza
  Entonces:  el SVG se renderiza vacío (sin paths) sin lanzar errores en consola
```

---

#### HU-03: Componente BtnComponent

```
Como:        Desarrollador frontend
Quiero:      Un componente de botón con variantes visuales y soporte de íconos
Para:        Ofrecer acciones de UI consistentes (primaria, secundaria, fantasma) adaptadas al contexto del cotizador

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01, HU-02
Capa:        Frontend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: Variantes visuales
  Dado que:  el componente recibe @Input() variant="primary" | "secondary" | "ghost"
  Cuando:    se renderiza
  Entonces:  el botón aplica la clase CSS btn-primary | btn-secondary | btn-ghost respectivamente
```

```gherkin
CRITERIO-3.2: Íconos flanqueando el texto
  Dado que:  el componente recibe @Input() iconLeft="plus" y @Input() iconRight="arrow-right"
  Cuando:    se renderiza con contenido de texto entre las etiquetas del componente
  Entonces:  el ícono izquierdo aparece antes del texto y el derecho después
```

```gherkin
CRITERIO-3.3: Tamaños sm y xs
  Dado que:  el componente recibe @Input() size="sm" | "xs"
  Cuando:    se renderiza
  Entonces:  aplica la clase btn-sm | btn-xs y los íconos internos usan tamaños 14px | 12px respectivamente
```

**Error Path**
```gherkin
CRITERIO-3.4: Estado disabled
  Dado que:  el componente recibe @Input() disabled=true
  Cuando:    el usuario hace clic sobre el botón
  Entonces:  el atributo disabled nativo está presente en el <button>, el evento (click) no se propaga y el cursor es not-allowed
```

---

#### HU-04: Componentes BadgeComponent y StatusBadgeComponent

```
Como:        Desarrollador frontend
Quiero:      Componentes de etiqueta visual para estados genéricos y estados específicos del folio
Para:        Comunicar visualmente el estado de registros en tablas, listas y tarjetas del cotizador

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: Variantes de BadgeComponent
  Dado que:  BadgeComponent recibe @Input() variant="ok" | "warn" | "info" | "brand" o sin variant (neutro)
  Cuando:    se renderiza
  Entonces:  aplica la clase badge-ok | badge-warn | badge-info | badge-brand | badge (neutro) en el <span>
```

```gherkin
CRITERIO-4.2: Dot de color en BadgeComponent
  Dado que:  BadgeComponent recibe @Input() dot="oklch(0.68 0.17 150)"
  Cuando:    se renderiza
  Entonces:  aparece un <span class="dot"> con el background-color igual al valor recibido, previo al texto
```

```gherkin
CRITERIO-4.3: StatusBadgeComponent mapea estado del folio a variante y etiqueta
  Dado que:  StatusBadgeComponent recibe @Input() status="CREATED" | "IN_PROGRESS" | "CALCULATED" | "ISSUED"
  Cuando:    se renderiza
  Entonces:  muestra la etiqueta en español y usa el variant correcto según la tabla de mapeo definida en la sección de diseño
```

**Edge Case**
```gherkin
CRITERIO-4.4: StatusBadgeComponent con estado desconocido
  Dado que:  StatusBadgeComponent recibe @Input() status="ESTADO_DESCONOCIDO"
  Cuando:    se renderiza
  Entonces:  muestra el valor del status tal como llegó, usando variant neutro, sin error en consola
```

---

#### HU-05: Componentes de formulario (FieldComponent, InputComponent, SelectComponent, TextareaComponent, SwitchComponent)

```
Como:        Desarrollador frontend
Quiero:      Átomos de formulario con apariencia unificada, soporte de validación y accesibilidad
Para:        Construir formularios de cotización (datos generales, ubicaciones, cobertura) con experiencia de usuario consistente

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01, HU-02
Capa:        Frontend
```

#### Criterios de Aceptación — HU-05

**Happy Path**
```gherkin
CRITERIO-5.1: FieldComponent renderiza label y control hijo
  Dado que:  FieldComponent recibe @Input() label="Código postal" y @Input() required=true, y contiene un InputComponent como ng-content
  Cuando:    se renderiza
  Entonces:  aparece el label "Código postal" con el indicador visual * para requerido, seguido del control hijo
```

```gherkin
CRITERIO-5.2: FieldComponent muestra mensaje de error con ícono
  Dado que:  FieldComponent recibe @Input() error="Campo requerido"
  Cuando:    se renderiza
  Entonces:  aparece un div.field-error con el IconComponent name="alert" (12px) y el texto "Campo requerido"
```

```gherkin
CRITERIO-5.3: FieldComponent muestra mensaje de ayuda cuando no hay error
  Dado que:  FieldComponent recibe @Input() help="Ingresa 5 dígitos" y no recibe @Input() error
  Cuando:    se renderiza
  Entonces:  aparece un div.field-help con el texto "Ingresa 5 dígitos" y NO aparece div.field-error
```

```gherkin
CRITERIO-5.4: InputComponent, SelectComponent y TextareaComponent aplican clase CSS unificada
  Dado que:  se renderizan InputComponent, SelectComponent o TextareaComponent
  Cuando:    se visualizan
  Entonces:  tienen las clases CSS "input", "select" y "textarea" respectivamente y respetan las variables --input-h de densidad
```

```gherkin
CRITERIO-5.5: SwitchComponent es accesible por teclado
  Dado que:  SwitchComponent tiene @Input() on=false y recibe foco vía teclado
  Cuando:    el usuario presiona Enter o Barra espaciadora
  Entonces:  emite @Output() change con el valor true y el atributo aria-checked cambia a "true"
```

**Error Path**
```gherkin
CRITERIO-5.6: SwitchComponent emite evento correcto en cambio
  Dado que:  SwitchComponent tiene @Input() on=true
  Cuando:    el usuario hace clic en el componente
  Entonces:  emite @Output() change con el valor false (toggle)
```

---

#### HU-06: Componentes de presentación (SectionHeaderComponent, SparklineComponent, StatCardComponent)

```
Como:        Desarrollador frontend
Quiero:      Componentes de presentación de información reutilizables
Para:        Mostrar encabezados de sección, barras de progreso y tarjetas de estadísticas de forma consistente en el cotizador

Prioridad:   Media
Estimación:  S
Dependencias: HU-01
Capa:        Frontend
```

#### Criterios de Aceptación — HU-06

**Happy Path**
```gherkin
CRITERIO-6.1: SectionHeaderComponent con todas las secciones
  Dado que:  SectionHeaderComponent recibe @Input() eyebrow="DATOS GENERALES", @Input() title="Información del asegurado", @Input() subtitle="Completa los datos requeridos" y @Input() actions (ng-content)
  Cuando:    se renderiza
  Entonces:  el eyebrow aparece en monoespaciado uppercase, el título como h1/heading, el subtitle en color text-dim y las acciones en el lado derecho con separador inferior de --border
```

```gherkin
CRITERIO-6.2: SparklineComponent muestra barra de progreso proporcional
  Dado que:  SparklineComponent recibe @Input() pct=65
  Cuando:    se renderiza
  Entonces:  la barra interna div.progress-bar tiene width: 65% dentro del contenedor div.progress
```

```gherkin
CRITERIO-6.3: StatCardComponent muestra estadística con tono de color
  Dado que:  StatCardComponent recibe @Input() label="Cotizaciones activas", @Input() value="24", @Input() subtext="este mes" y @Input() tone="brand" | "info" | "neutral"
  Cuando:    se renderiza
  Entonces:  el label, value y subtext se muestran correctamente y el acento del tono brand usa var(--brand-500), info usa var(--info), neutral usa var(--text-dim)
```

**Edge Case**
```gherkin
CRITERIO-6.4: SparklineComponent con pct fuera de rango
  Dado que:  SparklineComponent recibe @Input() pct=150 o @Input() pct=-10
  Cuando:    se renderiza
  Entonces:  el valor se limita (clamp) al rango [0, 100] antes de aplicarlo como width%
```

```gherkin
CRITERIO-6.5: SectionHeaderComponent sin eyebrow ni subtitle
  Dado que:  SectionHeaderComponent solo recibe @Input() title="Resumen"
  Cuando:    se renderiza
  Entonces:  solo aparece el elemento h1 con el título, sin secciones vacías ni espacio extra para eyebrow o subtitle
```

---

### Reglas de Negocio

1. Los átomos **no importan** otros componentes del propio proyecto — solo módulos Angular core (`CommonModule`).
2. Todos los tokens de diseño se definen como CSS custom properties en un archivo `tokens.scss` importado en `styles.scss`. No se usan valores hardcodeados en los SCSS de cada componente.
3. El mapeo de estados de folio (`StatusBadge`) es inmutable dentro del átomo y se define como constante TypeScript:
   - `CREATED` → label: "Creado", variant: "info", dot: `var(--info)`
   - `IN_PROGRESS` → label: "En proceso", variant: "warn", dot: `var(--warn)`
   - `CALCULATED` → label: "Calculado", variant: "ok", dot: `var(--ok)`
   - `ISSUED` → label: "Emitido", variant: "brand", dot: `var(--brand-500)`
4. `SwitchComponent` debe cumplir WCAG 2.1 AA: `role="switch"`, `aria-checked`, navegación por teclado (Enter/Space), y contraste ≥ 4.5:1.
5. `SparklineComponent` recibe el porcentaje ya calculado (0-100). El cálculo es responsabilidad del componente padre.
6. `FieldComponent` muestra **error** con prioridad sobre **help**: si ambos están presentes, solo se renderiza el mensaje de error.

---

## 2. DISEÑO

### Modelos de Datos

No aplica — componentes puramente visuales sin persistencia ni llamadas HTTP.

### API Endpoints

No aplica — sin contratos de API.

---

### Diseño Frontend

#### Sistema de Tokens

**Archivo:** `src/styles/tokens.scss`

| Categoría | Variables | Descripción |
|-----------|-----------|-------------|
| Brand | `--brand-50` … `--brand-900` | Escala cromática OKLCH, hue 142 (verde por defecto) |
| Neutrales cálidos | `--ink-0` … `--ink-900` | Grises con chroma ~0.01 |
| Semánticos | `--ok`, `--warn`, `--err`, `--info` | Estado: verde, amarillo, rojo, azul |
| Superficies | `--bg`, `--bg-sunk`, `--surface`, `--surface-2`, `--border`, `--border-strong` | Fondos y bordes |
| Texto | `--text`, `--text-dim`, `--text-mute` | Jerarquía tipográfica |
| Radios | `--r-xs` (4px) … `--r-pill` (999px) | Bordes redondeados |
| Espaciado | `--s-1` (4px) … `--s-16` (64px) | Escala de 4px |
| Tipografía | `--font-sans`, `--font-mono`, `--fs-11` … `--fs-40` | Familias y tamaños |
| Sombras | `--sh-1` … `--sh-pop` | Elevaciones sutiles |
| Densidad | `--row-h`, `--input-h`, `--btn-h`, `--pad-card` | Variables que cambian con `data-density` |
| Transición | `--ease`, `--t-fast` (120ms), `--t` (200ms) | Curvas y duraciones |

**Temas (sobre elemento raíz o contenedor):**
- `[data-theme="dark"]` — sobreescribe tokens de superficie y sombra
- `[data-density="compact" | "cozy"]` — ajusta dimensiones de altura e interno de padding
- `[data-primary="lime" | "teal" | "indigo" | "amber"]` — reemplaza la escala `--brand-500/600/700`

---

#### Componentes nuevos

| Componente Angular | Archivo | Selector | Descripción |
|-------------------|---------|----------|-------------|
| `IconComponent` | `atoms/icon/icon.component.ts` | `app-icon` | SVG inline, catálogo de 29 íconos |
| `BtnComponent` | `atoms/btn/btn.component.ts` | `app-btn` | Botón con variantes y soporte de íconos |
| `BadgeComponent` | `atoms/badge/badge.component.ts` | `app-badge` | Etiqueta de estado genérica |
| `StatusBadgeComponent` | `atoms/status-badge/status-badge.component.ts` | `app-status-badge` | Etiqueta de estado específica del folio |
| `FieldComponent` | `atoms/field/field.component.ts` | `app-field` | Wrapper de campo de formulario |
| `InputComponent` | `atoms/input/input.component.ts` | `app-input` | Input nativo con clase CSS unificada |
| `SelectComponent` | `atoms/select/select.component.ts` | `app-select` | Select nativo con clase CSS unificada |
| `TextareaComponent` | `atoms/textarea/textarea.component.ts` | `app-textarea` | Textarea nativo con clase CSS unificada |
| `SwitchComponent` | `atoms/switch/switch.component.ts` | `app-switch` | Toggle accesible WCAG 2.1 AA |
| `SectionHeaderComponent` | `atoms/section-header/section-header.component.ts` | `app-section-header` | Cabecera de sección con eyebrow, title, subtitle y acciones |
| `SparklineComponent` | `atoms/sparkline/sparkline.component.ts` | `app-sparkline` | Barra de progreso horizontal 0-100% |
| `StatCardComponent` | `atoms/stat-card/stat-card.component.ts` | `app-stat-card` | Tarjeta de estadística con tono de color |

---

#### Contratos de Componentes (TypeScript)

**`IconComponent`**
```typescript
// atoms/icon/icon.component.ts
@Input() name: IconName;           // string literal union del catálogo
@Input() size: number = 16;        // px
@Input() stroke: number = 1.6;     // stroke-width SVG
@Input() className?: string;       // clase CSS adicional
```

**Catálogo de íconos (`IconName` type):**
`'file' | 'plus' | 'search' | 'filter' | 'check' | 'x' | 'edit' | 'trash' | 'dots' | 'alert' | 'info' | 'check-circle' | 'x-circle' | 'map-pin' | 'calculator' | 'shield' | 'layers' | 'arrow-right' | 'arrow-left' | 'download' | 'copy' | 'sparkle' | 'cog' | 'clock' | 'eye' | 'grid' | 'list' | 'chevron-right' | 'chevron-down' | 'chevron-left'`

---

**`BtnComponent`**
```typescript
// atoms/btn/btn.component.ts
@Input() variant: 'primary' | 'secondary' | 'ghost' = 'secondary';
@Input() size?: 'sm' | 'xs';
@Input() iconLeft?: IconName;      // ícono a la izquierda del texto
@Input() iconRight?: IconName;     // ícono a la derecha del texto
@Input() disabled: boolean = false;
@Input() type: 'button' | 'submit' | 'reset' = 'button';
// Contenido: ng-content (texto del botón)
```

---

**`BadgeComponent`**
```typescript
// atoms/badge/badge.component.ts
@Input() variant: 'ok' | 'warn' | 'info' | 'brand' | '' = '';  // '' = neutro
@Input() dot?: string;    // color CSS para el dot (ej. 'var(--ok)')
// Contenido: ng-content (texto)
```

---

**`StatusBadgeComponent`**
```typescript
// atoms/status-badge/status-badge.component.ts
@Input() status!: QuoteStatus;    // 'CREATED' | 'IN_PROGRESS' | 'CALCULATED' | 'ISSUED'
```

Constante de mapeo interno (no exportada):
```typescript
const STATUS_META: Record<QuoteStatus, { label: string; variant: BadgeVariant; dot: string }> = {
  CREATED:     { label: 'Creado',     variant: 'info',   dot: 'var(--info)' },
  IN_PROGRESS: { label: 'En proceso', variant: 'warn',   dot: 'var(--warn)' },
  CALCULATED:  { label: 'Calculado',  variant: 'ok',     dot: 'var(--ok)' },
  ISSUED:      { label: 'Emitido',    variant: 'brand',  dot: 'var(--brand-500)' },
};
```

---

**`FieldComponent`**
```typescript
// atoms/field/field.component.ts
@Input() label?: string;
@Input() required: boolean = false;
@Input() help?: string;
@Input() error?: string;
@Input() span?: number;   // grid-column span
// Contenido: ng-content (control hijo: app-input, app-select, app-textarea, etc.)
```

---

**`InputComponent`**
```typescript
// atoms/input/input.component.ts
// Extiende atributos nativos de <input> via HostBinding o AttrDir
// Clase CSS fija: "input"
// Pasa todos los atributos al elemento nativo (type, placeholder, value, etc.)
```

**`SelectComponent`**
```typescript
// atoms/select/select.component.ts
// Clase CSS fija: "select"
// Contenido: ng-content (opciones <option>)
```

**`TextareaComponent`**
```typescript
// atoms/textarea/textarea.component.ts
// Clase CSS fija: "textarea"
// Pasa atributos nativos (rows, placeholder, etc.)
```

---

**`SwitchComponent`**
```typescript
// atoms/switch/switch.component.ts
@Input() on: boolean = false;
@Output() change = new EventEmitter<boolean>();
// Atributos ARIA: role="switch", aria-checked, tabIndex=0
// Teclado: Enter y Barra espaciadora emiten change(!on)
```

---

**`SectionHeaderComponent`**
```typescript
// atoms/section-header/section-header.component.ts
@Input() eyebrow?: string;    // texto en monoespaciado uppercase
@Input() title!: string;      // h1/heading principal
@Input() subtitle?: string;   // descripción secundaria
// Slot de acciones: ng-content select="[slot=actions]"
```

---

**`SparklineComponent`**
```typescript
// atoms/sparkline/sparkline.component.ts
@Input() pct: number = 0;      // 0-100 (se hace clamp internamente)
@Input() height: number = 4;   // px de altura de la barra
```

---

**`StatCardComponent`**
```typescript
// atoms/stat-card/stat-card.component.ts
@Input() label!: string;
@Input() value!: string;
@Input() subtext?: string;
@Input() tone: 'brand' | 'info' | 'neutral' = 'neutral';
```

Resolución de tono a color CSS:
- `brand` → `var(--brand-500)`
- `info` → `var(--info)`
- `neutral` → `var(--text-dim)`

---

#### Modelos TypeScript compartidos

**Archivo:** `src/app/shared/ui/atoms/atoms.models.ts`

```typescript
export type IconName =
  'file' | 'plus' | 'search' | 'filter' | 'check' | 'x' | 'edit' | 'trash' |
  'dots' | 'alert' | 'info' | 'check-circle' | 'x-circle' | 'map-pin' |
  'calculator' | 'shield' | 'layers' | 'arrow-right' | 'arrow-left' |
  'download' | 'copy' | 'sparkle' | 'cog' | 'clock' | 'eye' | 'grid' | 'list' |
  'chevron-right' | 'chevron-down' | 'chevron-left';

export type BadgeVariant = 'ok' | 'warn' | 'info' | 'brand' | '';

export type QuoteStatus = 'CREATED' | 'IN_PROGRESS' | 'CALCULATED' | 'ISSUED';

export type BtnVariant = 'primary' | 'secondary' | 'ghost';
export type BtnSize = 'sm' | 'xs';
export type StatTone = 'brand' | 'info' | 'neutral';
```

---

#### Estructura de archivos objetivo

```
src/
├── styles/
│   └── tokens.scss                        ← tokens de diseño (importado en styles.scss)
└── app/
    └── shared/
        └── ui/
            └── atoms/
                ├── atoms.models.ts        ← tipos compartidos de átomos
                ├── icon/
                │   ├── icon.component.ts
                │   ├── icon.component.html
                │   └── icon.component.scss
                ├── btn/
                │   ├── btn.component.ts
                │   ├── btn.component.html
                │   └── btn.component.scss
                ├── badge/
                │   ├── badge.component.ts
                │   ├── badge.component.html
                │   └── badge.component.scss
                ├── status-badge/
                │   ├── status-badge.component.ts
                │   ├── status-badge.component.html
                │   └── status-badge.component.scss
                ├── field/
                │   ├── field.component.ts
                │   ├── field.component.html
                │   └── field.component.scss
                ├── input/
                │   ├── input.component.ts
                │   └── input.component.scss
                ├── select/
                │   ├── select.component.ts
                │   ├── select.component.html
                │   └── select.component.scss
                ├── textarea/
                │   ├── textarea.component.ts
                │   └── textarea.component.scss
                ├── switch/
                │   ├── switch.component.ts
                │   ├── switch.component.html
                │   └── switch.component.scss
                ├── section-header/
                │   ├── section-header.component.ts
                │   ├── section-header.component.html
                │   └── section-header.component.scss
                ├── sparkline/
                │   ├── sparkline.component.ts
                │   ├── sparkline.component.html
                │   └── sparkline.component.scss
                └── stat-card/
                    ├── stat-card.component.ts
                    ├── stat-card.component.html
                    └── stat-card.component.scss
```

---

### Arquitectura y Dependencias

- **Paquetes nuevos requeridos:** ninguno. Solo Angular core.
- **Servicios externos:** ninguno.
- **Módulos/imports por componente:**
  - `IconComponent` — sin imports de otros componentes del proyecto.
  - `BtnComponent` — importa `IconComponent`.
  - `BadgeComponent` — sin imports de otros componentes del proyecto.
  - `StatusBadgeComponent` — importa `BadgeComponent`.
  - `FieldComponent` — importa `IconComponent`. Usa `ng-content` para el control hijo.
  - `InputComponent`, `SelectComponent`, `TextareaComponent` — sin imports de componentes del proyecto.
  - `SwitchComponent` — sin imports de componentes del proyecto.
  - `SectionHeaderComponent` — usa `ng-content`. Sin imports de componentes del proyecto.
  - `SparklineComponent` — sin imports de componentes del proyecto.
  - `StatCardComponent` — sin imports de componentes del proyecto.
- **Impacto en `styles.scss`:** agregar `@import 'styles/tokens'` como primera línea.
- **Impacto en el punto de entrada de la app:** ninguno. Los átomos son `standalone: true` y se importan individualmente donde se usen.

### Notas de Implementación

- Los SVG paths de `IconComponent` deben almacenarse como un objeto `Record<IconName, string>` de paths SVG (la parte interna del `<svg>`) y renderizarse con `[innerHTML]` o directamente como template Angular con `@switch`. Si se usa `[innerHTML]`, marcar el contenido como `SafeHtml` con `DomSanitizer`.
- `InputComponent`, `SelectComponent` y `TextareaComponent` deben implementar `ControlValueAccessor` para ser compatibles con `ReactiveFormsModule` y `ngModel`.
- `SwitchComponent` también debe implementar `ControlValueAccessor`.
- El `FieldComponent` usa `ng-content` — el control hijo es responsabilidad del componente padre. `FieldComponent` no valida directamente; solo muestra el `@Input() error` que le pase el formulario reactivo padre.
- Los SCSS de cada átomo solo usan custom properties de `tokens.scss` — prohibido hardcodear colores, tamaños o fuentes.
- Para `SparklineComponent`, aplicar `Math.min(100, Math.max(0, pct))` antes de usarlo como width.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

No aplica — feature puramente frontend.

---

### Frontend

#### Preparación

- [ ] Crear archivo `src/styles/tokens.scss` con todas las custom properties de diseño (brand, ink, semánticos, superficies, tipografía, radios, espaciado, sombras, densidad, transición, temas dark, densidades compact/cozy, primarios lime/teal/indigo/amber)
- [ ] Importar `@import 'styles/tokens'` en `src/styles.scss`
- [ ] Crear `src/app/shared/ui/atoms/atoms.models.ts` con los tipos `IconName`, `BadgeVariant`, `QuoteStatus`, `BtnVariant`, `BtnSize`, `StatTone`

#### Implementación de Átomos

- [ ] Implementar `IconComponent` — SVG inline, catálogo de 29 íconos, inputs: `name`, `size`, `stroke`, `className`
- [ ] Implementar `BtnComponent` — variantes primary/secondary/ghost, tamaños sm/xs, iconLeft/iconRight, disabled
- [ ] Implementar `BadgeComponent` — variantes ok/warn/info/brand/neutro, dot de color, ng-content
- [ ] Implementar `StatusBadgeComponent` — mapeo STATUS_META de 4 estados del folio, reutiliza BadgeComponent
- [ ] Implementar `FieldComponent` — label, required, help, error (con ícono alert), span de grid, ng-content para control hijo
- [ ] Implementar `InputComponent` — clase "input", ControlValueAccessor, pasa atributos nativos
- [ ] Implementar `SelectComponent` — clase "select", ControlValueAccessor, ng-content para <option>
- [ ] Implementar `TextareaComponent` — clase "textarea", ControlValueAccessor, pasa atributos nativos
- [ ] Implementar `SwitchComponent` — role="switch", aria-checked, tabIndex=0, teclas Enter/Space, ControlValueAccessor, emite `change: EventEmitter<boolean>`
- [ ] Implementar `SectionHeaderComponent` — eyebrow (mono uppercase), title, subtitle, slot de acciones con ng-content, separador inferior --border
- [ ] Implementar `SparklineComponent` — barra de progreso horizontal, clamp [0, 100], input `pct` y `height`
- [ ] Implementar `StatCardComponent` — label, value, subtext, tone (brand/info/neutral), acento de color por tono

#### Verificación de Accesibilidad

- [ ] Verificar que `SwitchComponent` cumple WCAG 2.1 AA: role="switch", aria-checked, foco visible, contraste ≥ 4.5:1
- [ ] Verificar que todos los átomos tienen `:focus-visible` aplicado via tokens.scss
- [ ] Verificar que `BtnComponent` en estado disabled tiene `aria-disabled="true"` además del atributo nativo

---

### Tests Frontend

> Los componentes y templates no se testean (regla del proyecto). Solo aplica TDD a lógica pura.

- [ ] **No aplica TDD** — los átomos son presentacionales sin lógica de negocio.
- [ ] Si `SparklineComponent` extrae la función de clamp como utilidad pura (`clampPct(pct: number): number`), escribir test unitario para esa función en `sparkline.utils.spec.ts`.

---

### QA

- [ ] Ejecutar skill `/gherkin-case-generator` → generar escenarios detallados para CRITERIO-1.1 a 6.5
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos de regresión visual
- [ ] Validar visualmente los 4 temas de color (`data-primary`) en modo claro y oscuro
- [ ] Validar las 3 densidades (`compact`, `standard`, `cozy`) en BtnComponent, InputComponent y FieldComponent
- [ ] Confirmar que `StatusBadgeComponent` muestra las 4 etiquetas en español con los colores correctos
- [ ] Confirmar navegación por teclado en `SwitchComponent` (Tab para foco, Enter/Space para toggle)
- [ ] Actualizar estado spec: `status: IMPLEMENTED`
