# Escenarios Gherkin — Sistema de Diseño Átomos
**Spec:** SPEC-001 design-system-atoms  
**Generado:** 2026-04-22  
**Criterios cubiertos:** CRITERIO-1.1 a 6.5

---

```gherkin
#language: es
Característica: Sistema de Diseño — Átomos (Design System Atoms)
  Como desarrollador frontend del cotizador
  Quiero contar con átomos reutilizables coherentes con el sistema de diseño
  Para construir las pantallas del cotizador con consistencia visual y accesibilidad

  # ─────────────────────────────────────────
  # HU-01: Sistema de tokens de diseño
  # ─────────────────────────────────────────

  @smoke @critico @tokens
  Escenario: CRITERIO-1.1 — Los tokens se resuelven correctamente en todos los componentes
    Dado que el archivo tokens.scss está importado en styles.scss
    Cuando cualquier componente átomo usa la custom property "var(--brand-500)"
    Entonces el valor se resuelve en tiempo de render sin errores CSS
    Y el color visible corresponde al valor OKLCH definido en tokens.scss

  @smoke @critico @tokens
  Escenario: CRITERIO-1.2 — Cambio al tema oscuro
    Dado que el atributo "data-theme=dark" está aplicado al elemento raíz
    Cuando el usuario visualiza cualquier átomo
    Entonces los tokens semánticos "--bg", "--surface", "--text" y "--border" toman sus valores de tema oscuro
    Y el fondo del átomo es significativamente más oscuro que en tema claro

  @smoke @critico @tokens
  Escenario: CRITERIO-1.3 — Densidad compact reduce dimensiones
    Dado que el atributo "data-density=compact" está aplicado al elemento raíz
    Cuando el usuario visualiza un InputComponent o BtnComponent
    Entonces "--input-h" vale 28px y "--btn-h" vale 28px
    Y los controles son visualmente más compactos que en densidad standard

  @happy-path @tokens
  Escenario: CRITERIO-1.3b — Densidad cozy aumenta dimensiones
    Dado que el atributo "data-density=cozy" está aplicado al elemento raíz
    Cuando el usuario visualiza un InputComponent o BtnComponent
    Entonces "--input-h" vale 44px y "--btn-h" vale 44px

  @smoke @tokens
  Escenario: CRITERIO-1.4 — Color primario intercambiable a teal
    Dado que el atributo "data-primary=teal" está aplicado al elemento raíz
    Cuando el usuario visualiza un BtnComponent con variant="primary"
    Entonces el fondo del botón usa la paleta teal definida en tokens.scss
    Y el color cambia sin recargar la página

  @edge-case @tokens
  Esquema del escenario: CRITERIO-1.4b — Cambio de primario a cada paleta
    Dado que el atributo "data-primary=<paleta>" está aplicado al elemento raíz
    Cuando el usuario visualiza un BtnComponent primario
    Entonces el botón muestra el color de la paleta "<paleta>"
    Ejemplos:
      | paleta |
      | lime   |
      | teal   |
      | indigo |
      | amber  |

  @edge-case @tokens
  Escenario: CRITERIO-1.5 — Sin tema explícito usa valores por defecto
    Dado que no hay atributo "data-theme" ni "data-density" en el árbol DOM
    Cuando se renderiza cualquier átomo
    Entonces los tokens usan tema claro y densidad standard
    Y "--input-h" vale 36px y "--btn-h" vale 36px

  # ─────────────────────────────────────────
  # HU-02: IconComponent
  # ─────────────────────────────────────────

  @smoke @critico @icon
  Escenario: CRITERIO-2.1 — Renderizar ícono por nombre
    Dado que el componente IconComponent recibe name="search"
    Cuando se renderiza en pantalla
    Entonces se muestra un elemento SVG con viewBox="0 0 24 24"
    Y los atributos fill="none" y stroke="currentColor" están presentes
    Y el SVG contiene el path correspondiente al ícono "search"

  @happy-path @icon
  Escenario: CRITERIO-2.2 — Tamaño y grosor de trazo configurables
    Dado que el componente recibe size=20 y stroke=2.0
    Cuando se renderiza
    Entonces el SVG tiene width=20 y height=20
    Y el atributo stroke-width vale 2.0

  @edge-case @icon
  Escenario: CRITERIO-2.3 — Nombre de ícono inexistente
    Dado que el componente recibe name="icono-inexistente"
    Cuando se renderiza
    Entonces el SVG se renderiza sin paths internos
    Y no se lanza ningún error en consola

  # ─────────────────────────────────────────
  # HU-03: BtnComponent
  # ─────────────────────────────────────────

  @smoke @critico @btn
  Esquema del escenario: CRITERIO-3.1 — Variantes visuales del botón
    Dado que el componente recibe variant="<variante>"
    Cuando se renderiza
    Entonces el elemento button tiene la clase "btn-<variante>"
    Ejemplos:
      | variante  |
      | primary   |
      | secondary |
      | ghost     |

  @happy-path @btn
  Escenario: CRITERIO-3.2 — Íconos flanqueando el texto
    Dado que el componente recibe iconLeft="plus" e iconRight="arrow-right"
    Y el contenido de texto es "Crear folio"
    Cuando se renderiza
    Entonces aparece el ícono "plus" antes del texto "Crear folio"
    Y el ícono "arrow-right" aparece después del texto

  @happy-path @btn
  Esquema del escenario: CRITERIO-3.3 — Tamaños sm y xs
    Dado que el componente recibe size="<tamaño>"
    Cuando se renderiza
    Entonces el botón tiene la clase "btn-<tamaño>"
    Y los íconos internos usan <pixeles>px de tamaño
    Ejemplos:
      | tamaño | pixeles |
      | sm     | 14      |
      | xs     | 12      |

  @error-path @btn
  Escenario: CRITERIO-3.4 — Estado disabled bloquea interacción
    Dado que el componente recibe disabled=true
    Cuando el usuario hace clic sobre el botón
    Entonces el atributo "disabled" nativo está presente en el elemento button
    Y el atributo "aria-disabled" vale "true"
    Y el evento click no se propaga al componente padre
    Y el cursor es "not-allowed"

  # ─────────────────────────────────────────
  # HU-04: BadgeComponent y StatusBadgeComponent
  # ─────────────────────────────────────────

  @smoke @critico @badge
  Esquema del escenario: CRITERIO-4.1 — Variantes de BadgeComponent
    Dado que BadgeComponent recibe variant="<variante>"
    Cuando se renderiza
    Entonces el elemento span tiene la clase "badge-<variante>"
    Ejemplos:
      | variante |
      | ok       |
      | warn     |
      | info     |
      | brand    |

  @happy-path @badge
  Escenario: CRITERIO-4.1b — Badge neutro sin variante
    Dado que BadgeComponent no recibe ninguna variante
    Cuando se renderiza
    Entonces el elemento span tiene únicamente la clase "badge"
    Y no tiene clases de color adicionales

  @happy-path @badge
  Escenario: CRITERIO-4.2 — Dot de color en BadgeComponent
    Dado que BadgeComponent recibe dot="oklch(0.68 0.17 150)"
    Cuando se renderiza
    Entonces aparece un elemento span con clase "dot"
    Y su background-color es "oklch(0.68 0.17 150)"
    Y el dot aparece antes del texto

  @smoke @critico @status-badge
  Esquema del escenario: CRITERIO-4.3 — StatusBadgeComponent mapea estado a etiqueta y variante
    Dado que StatusBadgeComponent recibe status="<estado>"
    Cuando se renderiza
    Entonces muestra la etiqueta "<etiqueta>" en español
    Y usa la variante de badge "<variante>"
    Ejemplos:
      | estado      | etiqueta   | variante |
      | CREATED     | Creado     | info     |
      | IN_PROGRESS | En proceso | warn     |
      | CALCULATED  | Calculado  | ok       |
      | ISSUED      | Emitido    | brand    |

  @edge-case @status-badge
  Escenario: CRITERIO-4.4 — StatusBadgeComponent con estado desconocido
    Dado que StatusBadgeComponent recibe status="ESTADO_DESCONOCIDO"
    Cuando se renderiza
    Entonces muestra el texto "ESTADO_DESCONOCIDO" tal como llegó
    Y usa el badge sin variante de color (neutro)
    Y no lanza ningún error en consola

  # ─────────────────────────────────────────
  # HU-05: Componentes de formulario
  # ─────────────────────────────────────────

  @smoke @critico @field
  Escenario: CRITERIO-5.1 — FieldComponent renderiza label con indicador requerido
    Dado que FieldComponent recibe label="Código postal" y required=true
    Y contiene un InputComponent como control hijo
    Cuando se renderiza
    Entonces aparece el label "Código postal"
    Y el indicador visual "*" está presente con color de error
    Y el control hijo aparece debajo del label

  @happy-path @field
  Escenario: CRITERIO-5.2 — FieldComponent muestra mensaje de error con ícono
    Dado que FieldComponent recibe error="Campo requerido"
    Cuando se renderiza
    Entonces aparece un elemento con clase "field-error"
    Y contiene el ícono "alert" de 12px
    Y muestra el texto "Campo requerido"
    Y no aparece el mensaje de ayuda

  @happy-path @field
  Escenario: CRITERIO-5.3 — FieldComponent muestra ayuda cuando no hay error
    Dado que FieldComponent recibe help="Ingresa 5 dígitos" sin error
    Cuando se renderiza
    Entonces aparece un elemento con clase "field-help" con el texto "Ingresa 5 dígitos"
    Y NO aparece ningún elemento con clase "field-error"

  @edge-case @field
  Escenario: CRITERIO-5.3b — Error tiene prioridad sobre ayuda
    Dado que FieldComponent recibe tanto error="Requerido" como help="Ingresa 5 dígitos"
    Cuando se renderiza
    Entonces solo se muestra el mensaje de error "Requerido"
    Y el mensaje de ayuda "Ingresa 5 dígitos" no se renderiza

  @happy-path @form-controls
  Esquema del escenario: CRITERIO-5.4 — Controles nativos aplican clase CSS unificada
    Dado que se renderiza el componente "<componente>"
    Cuando se visualiza en pantalla
    Entonces tiene la clase CSS "<clase>"
    Y su altura respeta la variable "--input-h" de densidad
    Ejemplos:
      | componente        | clase    |
      | InputComponent    | input    |
      | SelectComponent   | select   |
      | TextareaComponent | textarea |

  @smoke @critico @switch @accesibilidad
  Escenario: CRITERIO-5.5 — SwitchComponent accesible por teclado (toggle a true)
    Dado que SwitchComponent tiene on=false y recibe foco vía teclado
    Cuando el usuario presiona la tecla "Enter"
    Entonces el componente emite el evento change con valor true
    Y el atributo "aria-checked" cambia a "true"

  @happy-path @switch @accesibilidad
  Escenario: CRITERIO-5.5b — SwitchComponent toggle con barra espaciadora
    Dado que SwitchComponent tiene on=false y recibe foco vía teclado
    Cuando el usuario presiona la tecla "Barra espaciadora"
    Entonces el componente emite el evento change con valor true
    Y el atributo "aria-checked" cambia a "true"

  @error-path @switch
  Escenario: CRITERIO-5.6 — SwitchComponent emite valor inverso al hacer clic
    Dado que SwitchComponent tiene on=true
    Cuando el usuario hace clic sobre el componente
    Entonces el componente emite el evento change con valor false
    Y el atributo "aria-checked" cambia a "false"

  # ─────────────────────────────────────────
  # HU-06: Componentes de presentación
  # ─────────────────────────────────────────

  @smoke @critico @section-header
  Escenario: CRITERIO-6.1 — SectionHeaderComponent con todas las secciones
    Dado que SectionHeaderComponent recibe eyebrow="DATOS GENERALES"
    Y title="Información del asegurado"
    Y subtitle="Completa los datos requeridos"
    Y acciones en el slot "actions"
    Cuando se renderiza
    Entonces el eyebrow aparece en fuente monoespaciada en mayúsculas
    Y el título aparece como heading con font-size-20
    Y el subtitle aparece en color "--text-dim"
    Y las acciones aparecen a la derecha con separador inferior de "--border"

  @edge-case @section-header
  Escenario: CRITERIO-6.5 — SectionHeaderComponent solo con título
    Dado que SectionHeaderComponent solo recibe title="Resumen"
    Cuando se renderiza
    Entonces solo aparece el elemento h1 con el texto "Resumen"
    Y no hay espacio vacío para eyebrow ni subtitle

  @smoke @critico @sparkline
  Escenario: CRITERIO-6.2 — SparklineComponent muestra barra de progreso proporcional
    Dado que SparklineComponent recibe pct=65
    Cuando se renderiza
    Entonces el elemento "div.progress-bar" tiene width del 65%
    Y está contenido dentro del elemento "div.progress"

  @smoke @critico @stat-card
  Escenario: CRITERIO-6.3 — StatCardComponent muestra estadística con tono brand
    Dado que StatCardComponent recibe label="Cotizaciones activas", value="24", subtext="este mes" y tone="brand"
    Cuando se renderiza
    Entonces se muestra el label "Cotizaciones activas"
    Y el valor "24" en tamaño destacado
    Y el subtexto "este mes"
    Y el acento de color usa "var(--brand-500)"

  @happy-path @stat-card
  Esquema del escenario: CRITERIO-6.3b — StatCardComponent resuelve tono a color correcto
    Dado que StatCardComponent recibe tone="<tono>"
    Cuando se renderiza
    Entonces el acento del borde superior usa "<variable_css>"
    Ejemplos:
      | tono    | variable_css    |
      | brand   | var(--brand-500)|
      | info    | var(--info)     |
      | neutral | var(--text-dim) |

  @edge-case @sparkline
  Escenario: CRITERIO-6.4 — SparklineComponent limita pct mayor a 100
    Dado que SparklineComponent recibe pct=150
    Cuando se renderiza
    Entonces la barra tiene width del 100% (valor limitado al máximo)

  @edge-case @sparkline
  Escenario: CRITERIO-6.4b — SparklineComponent limita pct negativo
    Dado que SparklineComponent recibe pct=-10
    Cuando se renderiza
    Entonces la barra tiene width del 0% (valor limitado al mínimo)
```

---

## Datos de Prueba Sintéticos

| Escenario | Campo | Valor válido | Valor inválido | Valor borde |
|-----------|-------|-------------|----------------|-------------|
| IconComponent | name | `"search"` | `"icono-inexistente"` | `"chevron-left"` (último del catálogo) |
| BtnComponent variante | variant | `"primary"` | — | `"ghost"` |
| BtnComponent tamaño | size | `"sm"` | — | `"xs"` |
| BtnComponent disabled | disabled | `false` | `true` | — |
| BadgeComponent | variant | `"ok"` | — | `""` (neutro) |
| BadgeComponent dot | dot | `"oklch(0.68 0.17 150)"` | — | `"var(--ok)"` |
| StatusBadgeComponent | status | `"CREATED"` | `"ESTADO_DESCONOCIDO"` | `"ISSUED"` |
| FieldComponent label | label | `"Código postal"` | — | `undefined` |
| FieldComponent error | error | — | `"Campo requerido"` | `undefined` |
| SparklineComponent | pct | `65` | `-10` | `150` (sobre límite) |
| SparklineComponent borde | pct | `0`, `100` | — | `101` |
| StatCardComponent | tone | `"brand"` | — | `"neutral"` |
| SwitchComponent teclado | key | `"Enter"`, `" "` | `"Tab"`, `"Escape"` | — |
| Tokens tema | data-theme | `"dark"` | — | ausente (default claro) |
| Tokens densidad | data-density | `"compact"`, `"cozy"` | — | ausente (default standard) |
| Tokens primario | data-primary | `"lime"`, `"teal"`, `"indigo"`, `"amber"` | — | ausente (default verde) |

---

## Resumen de cobertura

| Categoría | Total escenarios | @smoke | @error-path | @edge-case |
|-----------|-----------------|--------|-------------|------------|
| Tokens de diseño | 7 | 3 | 0 | 2 |
| IconComponent | 3 | 1 | 0 | 1 |
| BtnComponent | 5 | 1 | 1 | 0 |
| Badge / StatusBadge | 6 | 2 | 0 | 2 |
| Componentes form | 8 | 2 | 2 | 1 |
| Componentes presentación | 8 | 3 | 0 | 3 |
| **Total** | **37** | **12** | **3** | **9** |
