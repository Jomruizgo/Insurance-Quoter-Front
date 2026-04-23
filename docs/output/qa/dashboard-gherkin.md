# Escenarios Gherkin — Dashboard: Panel de Inventario de Folios

**Spec de referencia:** SPEC-004 — `dashboard.spec.md`
**Estado de la spec:** IMPLEMENTED
**Generado:** 2026-04-22
**Cubre:** CRITERIO-1.1 al CRITERIO-5.1 (HU-01 a HU-05)

---

## Datos de prueba de referencia

| Folio | Cliente | Estado | Prima comercial |
|-------|---------|--------|-----------------|
| FOL-2026-00001 | Empresa ABC | IN_PROGRESS | $125,000 |
| FOL-2026-00002 | Corporativo XYZ | CALCULATED | $87,500 |
| FOL-2026-00003 | Industrias DEF | CREATED | — (sin calcular) |
| FOL-2026-00004 | Grupo GHI | ISSUED | $210,000 |
| FOL-2026-00005 | Servicios JKL | IN_PROGRESS | $45,000 |

**Métricas esperadas del inventario completo:**
- Total de folios: 5
- En progreso (IN_PROGRESS): 2 (FOL-00001, FOL-00005)
- Calculados + Emitidos (CALCULATED + ISSUED): 2 (FOL-00002, FOL-00004)
- Prima acumulada: $422,500 (125,000 + 87,500 + 210,000 + 45,000; FOL-00003 excluido por prima nula)

---

```gherkin
#language: es

Característica: Dashboard — Panel de Inventario de Folios
  Como usuario autenticado (suscriptor o agente)
  Quiero ver el inventario de mis folios activos con métricas resumidas, filtros y modos de visualización
  Para gestionar mi portafolio de cotizaciones desde una única pantalla

  Antecedentes:
    Dado que el usuario ha iniciado sesión en el sistema


  # =========================================================
  # HU-01: Visualizar inventario de folios
  # =========================================================

  @smoke @critico @happy-path
  Escenario: CRITERIO-1.1 — Listado de folios cargado correctamente
    # Flujo: Happy Path principal — carga exitosa del inventario
    Dado que el servicio de inventario tiene los siguientes folios registrados:
      | Folio          | Cliente         | Estado      | Prima comercial |
      | FOL-2026-00001 | Empresa ABC     | IN_PROGRESS | 125000          |
      | FOL-2026-00002 | Corporativo XYZ | CALCULATED  | 87500           |
      | FOL-2026-00003 | Industrias DEF  | CREATED     | (sin prima)     |
      | FOL-2026-00004 | Grupo GHI       | ISSUED      | 210000          |
      | FOL-2026-00005 | Servicios JKL   | IN_PROGRESS | 45000           |
    Cuando el usuario navega a la pantalla principal del cotizador
    Entonces el sistema muestra las tarjetas de métricas con los valores calculados:
      | Métrica                    | Valor esperado |
      | Total de folios            | 5              |
      | En progreso                | 2              |
      | Calculados y emitidos      | 2              |
      | Prima comercial acumulada  | $422,500       |
    Y se muestra la tabla de folios en modo lista (por defecto)
    Y cada fila de la tabla contiene: folio, cliente, agente, estado, ubicaciones, progreso, prima comercial y fecha


  @error-path
  Escenario: CRITERIO-1.2 — Error de carga del inventario por falla del servidor
    # Flujo: Error Path — el servicio backend responde con error 500
    Dado que el servicio de inventario no está disponible y responde con un error interno del servidor
    Cuando el usuario navega a la pantalla principal del cotizador
    Entonces el sistema muestra un mensaje de error indicando que no se pudieron cargar los folios
    Y las tarjetas de métricas muestran "—" en lugar de valores numéricos
    Y la tabla de folios muestra un estado vacío con la opción de reintentar la carga

  @error-path
  Escenario: CRITERIO-1.2 — Error de carga del inventario por timeout de red
    # Flujo: Error Path — la solicitud excede el tiempo de espera
    Dado que la red presenta alta latencia y la solicitud al servicio de inventario supera el tiempo de espera
    Cuando el usuario navega a la pantalla principal del cotizador
    Entonces el sistema muestra un mensaje de error indicando que no se pudieron cargar los folios
    Y las tarjetas de métricas muestran "—" en lugar de valores numéricos
    Y la tabla de folios muestra un estado vacío con la opción de reintentar la carga


  @edge-case
  Escenario: CRITERIO-1.3 — Inventario vacío sin folios creados
    # Flujo: Edge Case — el usuario aún no tiene folios en el sistema
    Dado que el usuario no tiene ningún folio registrado en el sistema
    Cuando el usuario navega a la pantalla principal del cotizador
    Entonces las tarjetas de métricas muestran el valor 0 en todos los contadores
    Y la tabla de folios muestra el texto "No hay folios aún"
    Y el botón "Nuevo folio" sigue visible y disponible para crear el primer folio


  # =========================================================
  # HU-02: Filtrar folios por texto y estado
  # =========================================================

  @smoke @critico @happy-path
  Esquema del escenario: CRITERIO-2.1 — Filtrado por texto en tiempo real
    # Flujo: Happy Path — el filtro de texto actualiza la lista instantáneamente
    Dado que la lista de folios está cargada con los 5 folios de referencia
    Cuando el usuario escribe "<texto_busqueda>" en el campo de búsqueda
    Entonces la lista muestra únicamente los folios cuyo número o nombre de cliente contiene "<texto_busqueda>" (sin distinguir mayúsculas)
    Y los folios mostrados son: <folios_esperados>
    Y las tarjetas de métricas siguen mostrando los totales originales sin recalcularse
    Ejemplos:
      | texto_busqueda | folios_esperados                            |
      | FOL-2026-00001 | FOL-2026-00001                              |
      | empresa        | FOL-2026-00001                              |
      | Corporativo    | FOL-2026-00002                              |
      | XYZ            | FOL-2026-00002                              |
      | IN_PROGRESS    | (ningún folio — el filtro aplica sobre folio y cliente, no sobre estado) |
      | DEF            | FOL-2026-00003                              |


  @happy-path
  Esquema del escenario: CRITERIO-2.2 — Filtrado por estado
    # Flujo: Happy Path — el select de estado filtra la lista y se acumula con el texto
    Dado que la lista de folios está cargada con los 5 folios de referencia
    Y el campo de búsqueda está vacío
    Cuando el usuario selecciona el estado "<estado>" en el selector de estados
    Entonces la lista muestra únicamente los folios con ese estado exacto
    Y los folios mostrados son: <folios_esperados>
    Y el filtro de texto sigue activo simultáneamente con el filtro de estado
    Ejemplos:
      | estado      | folios_esperados                      |
      | IN_PROGRESS | FOL-2026-00001, FOL-2026-00005        |
      | CALCULATED  | FOL-2026-00002                        |
      | CREATED     | FOL-2026-00003                        |
      | ISSUED      | FOL-2026-00004                        |


  @happy-path
  Escenario: CRITERIO-2.2 — Filtros acumulativos: texto y estado aplicados simultáneamente
    # Flujo: Happy Path — los dos filtros actúan en AND lógico sin llamada HTTP adicional
    Dado que la lista de folios está cargada con los 5 folios de referencia
    Cuando el usuario escribe "ABC" en el campo de búsqueda
    Y el usuario selecciona el estado "IN_PROGRESS" en el selector de estados
    Entonces la lista muestra únicamente el folio FOL-2026-00001 (Empresa ABC, estado IN_PROGRESS)
    Y no se realiza ninguna petición adicional al servicio de inventario


  @happy-path
  Escenario: CRITERIO-2.3 — Restaurar vista completa al seleccionar "Todos los estados"
    # Flujo: Happy Path — limpiar el filtro de estado vuelve a mostrar todos los folios del texto activo
    Dado que la lista de folios está cargada con los 5 folios de referencia
    Y el usuario ha seleccionado el estado "IN_PROGRESS" mostrando 2 folios
    Y el campo de búsqueda está vacío
    Cuando el usuario selecciona "Todos los estados" en el selector de estados
    Entonces se muestran los 5 folios originales
    Y el filtro de texto sigue aplicado con su valor vigente (vacío en este caso)


  @edge-case
  Esquema del escenario: CRITERIO-2.4 — Sin resultados tras filtrado
    # Flujo: Edge Case — la combinación de filtros no retorna ningún folio
    Dado que la lista de folios está cargada con los 5 folios de referencia
    Cuando el usuario aplica los filtros: texto "<texto>" y estado "<estado>"
    Entonces la tabla muestra el mensaje "No se encontraron folios con estos filtros"
    Y los controles de filtro siguen visibles y editables para ajustar la búsqueda
    Ejemplos:
      | texto        | estado     |
      | ZZZ-9999     | ALL        |
      | Empresa ABC  | CALCULATED |
      | Grupo GHI    | IN_PROGRESS|


  # =========================================================
  # HU-03: Cambiar modo de visualización (lista / cuadrícula)
  # =========================================================

  @happy-path
  Escenario: CRITERIO-3.1 — Cambio a modo cuadrícula preserva los filtros activos
    # Flujo: Happy Path — el toggle de vista no reinicia los filtros
    Dado que la lista de folios está cargada con los 5 folios de referencia
    Y el usuario tiene activo el filtro de estado "IN_PROGRESS" mostrando 2 folios (FOL-00001 y FOL-00005)
    Y el modo de visualización actual es lista (tabla)
    Cuando el usuario hace clic en el botón de cambio a modo cuadrícula
    Entonces el sistema muestra la cuadrícula de 3 columnas con los mismos 2 folios filtrados
    Y los controles de búsqueda y estado conservan sus valores anteriores
    Y las tarjetas de métricas no cambian

  @happy-path
  Escenario: CRITERIO-3.2 — Regreso a modo lista desde cuadrícula preserva los filtros activos
    # Flujo: Happy Path — el toggle en sentido inverso tampoco reinicia filtros
    Dado que la lista de folios está cargada con los 5 folios de referencia
    Y el usuario está en modo cuadrícula con el filtro de texto "GHI" activo mostrando 1 folio (FOL-00004)
    Cuando el usuario hace clic en el botón de cambio a modo lista
    Entonces el sistema muestra la tabla con el mismo folio filtrado (FOL-2026-00004)
    Y el campo de búsqueda sigue mostrando el texto "GHI"
    Y el selector de estados mantiene su valor anterior


  # =========================================================
  # HU-04: Navegar a un folio desde el dashboard
  # =========================================================

  @smoke @critico @happy-path
  Esquema del escenario: CRITERIO-4.1 — Navegación a un folio desde la tabla (modo lista)
    # Flujo: Happy Path — clic en fila navega al folio correspondiente
    Dado que la tabla de folios está visible en modo lista con los 5 folios de referencia
    Cuando el usuario hace clic en la fila del folio "<folio>"
    Entonces el sistema navega a la pantalla de información general del folio "<folio>"
    Ejemplos:
      | folio          |
      | FOL-2026-00001 |
      | FOL-2026-00004 |


  @happy-path
  Esquema del escenario: CRITERIO-4.2 — Navegación a un folio desde la cuadrícula (modo grid)
    # Flujo: Happy Path — clic en tarjeta navega al folio correspondiente
    Dado que la cuadrícula de folios está visible en modo cuadrícula con los 5 folios de referencia
    Cuando el usuario hace clic en la tarjeta del folio "<folio>"
    Entonces el sistema navega a la pantalla de información general del folio "<folio>"
    Ejemplos:
      | folio          |
      | FOL-2026-00002 |
      | FOL-2026-00005 |


  # =========================================================
  # HU-05: Crear un nuevo folio desde el dashboard
  # =========================================================

  @smoke @critico @happy-path
  Escenario: CRITERIO-5.1 — Apertura del modal de nuevo folio sin salir del dashboard
    # Flujo: Happy Path — el botón "Nuevo folio" abre el modal en la misma pantalla
    Dado que el usuario está en la pantalla principal del cotizador
    Cuando el usuario hace clic en el botón "Nuevo folio"
    Entonces se abre el modal de creación de folio sobre la pantalla actual
    Y el usuario permanece en la URL del cotizador (no hay navegación a otra ruta)
    Y el inventario de folios sigue visible en el fondo
```

---

## Resumen de escenarios generados

| ID Criterio | HU | Tipo de flujo | Etiquetas | Escenario |
|-------------|-----|---------------|-----------|-----------|
| CRITERIO-1.1 | HU-01 | Happy Path | `@smoke @critico @happy-path` | Listado de folios cargado correctamente |
| CRITERIO-1.2 | HU-01 | Error Path (×2) | `@error-path` | Error por servidor caído / por timeout de red |
| CRITERIO-1.3 | HU-01 | Edge Case | `@edge-case` | Inventario vacío sin folios |
| CRITERIO-2.1 | HU-02 | Happy Path (esquema) | `@smoke @critico @happy-path` | Filtrado por texto en tiempo real (6 variantes) |
| CRITERIO-2.2 | HU-02 | Happy Path (esquema + escenario) | `@happy-path` | Filtrado por estado (4 variantes) + filtros acumulativos |
| CRITERIO-2.3 | HU-02 | Happy Path | `@happy-path` | Restaurar vista con "Todos los estados" |
| CRITERIO-2.4 | HU-02 | Edge Case (esquema) | `@edge-case` | Sin resultados tras filtrado (3 variantes) |
| CRITERIO-3.1 | HU-03 | Happy Path | `@happy-path` | Cambio a cuadrícula preserva filtros |
| CRITERIO-3.2 | HU-03 | Happy Path | `@happy-path` | Regreso a lista preserva filtros |
| CRITERIO-4.1 | HU-04 | Happy Path (esquema) | `@smoke @critico @happy-path` | Navegación desde tabla (2 variantes) |
| CRITERIO-4.2 | HU-04 | Happy Path (esquema) | `@happy-path` | Navegación desde cuadrícula (2 variantes) |
| CRITERIO-5.1 | HU-05 | Happy Path | `@smoke @critico @happy-path` | Apertura del modal de nuevo folio |

**Total de escenarios Gherkin:** 12 escenarios base
**Total de filas de `Ejemplos:`:** 17 variantes de datos
**Escenarios `@smoke @critico`:** 4 (CRITERIO-1.1, CRITERIO-2.1, CRITERIO-4.1, CRITERIO-5.1)
