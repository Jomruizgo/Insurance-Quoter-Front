#language: es

# Escenarios Gherkin — Gestión de Ubicaciones de Riesgo
# Spec: SPEC-007 — quote-locations
# Generado: 2026-04-22
# Criterios cubiertos: CRITERIO-1.1 a CRITERIO-6.1 + reglas de negocio complementarias

---

Característica: Gestión de ubicaciones de riesgo en el cotizador (Paso 3 de 5)

  Como agente de cotización
  Quiero registrar, editar y validar todas las ubicaciones de riesgo de un folio
  Para asegurar que la información esté completa antes del cálculo de prima

  ##############################################################################
  # HU-01: Visualización y navegación de ubicaciones
  ##############################################################################

  @happy-path @critico @HU-01 @CRITERIO-1.1
  Escenario: La tabla muestra todas las ubicaciones con su estado de completitud
    Dado que el folio "FOL-2026-00042" tiene 3 ubicaciones registradas
    Y 2 ubicaciones están en estado "Completa" y 1 en estado "Con alertas"
    Cuando el agente navega a la pantalla de ubicaciones del folio
    Entonces la cabecera muestra "3 de 3 ubicaciones registradas · 2 completas · 1 con alertas"
    Y la tabla presenta exactamente 3 filas con el estado individual de cada ubicación
    Y el banner de alertas es visible indicando el número de ubicaciones con problemas

  @edge-case @HU-01 @CRITERIO-1.2
  Escenario: La tabla muestra el bloque vacío cuando no hay ubicaciones registradas
    Dado que el folio "FOL-2026-00099" tiene configuradas 3 ubicaciones en el layout
    Y ninguna ubicación ha sido registrada aún
    Cuando el agente navega a la pantalla de ubicaciones del folio
    Entonces la tabla muestra la leyenda "+ Añadir 3 ubicaciones restantes"
    Y el contador de cabecera muestra "0 de 3 ubicaciones registradas"
    Y no se muestran filas de datos en la tabla

  ##############################################################################
  # HU-02: Crear y editar ubicación — Datos básicos y CP
  ##############################################################################

  @happy-path @critico @HU-02 @CRITERIO-2.1
  Escenario: El auto-relleno de municipio, estado y colonias se activa con un código postal válido
    Dado que el panel lateral de edición de la ubicación 1 está abierto en la pestaña "Datos básicos"
    Y el campo Código Postal está vacío
    Cuando el agente escribe "06600" en el campo Código Postal
    Entonces el campo Estado se rellena automáticamente con "Ciudad de México" y queda en modo solo lectura
    Y el campo Municipio se rellena automáticamente con "Cuauhtémoc" y queda en modo solo lectura
    Y el selector de Colonia presenta las opciones "Juárez" y "Tabacalera"
    Y el badge de zona catastrófica muestra "TEV-1 · FHM-2 · ZONE_A"
    Y la alerta "Código postal requerido" desaparece de la lista de alertas bloqueantes

  @error-path @HU-02 @CRITERIO-2.2
  Escenario: Se muestra un mensaje de error cuando el código postal no existe en el catálogo
    Dado que el panel lateral de edición de la ubicación 1 está abierto en la pestaña "Datos básicos"
    Cuando el agente escribe "99999" en el campo Código Postal
    Entonces se muestra el mensaje "Código postal no encontrado en el catálogo" bajo el campo
    Y los campos Estado, Municipio y Colonia quedan vacíos
    Y la alerta "Código postal requerido" permanece activa en el footer
    Y el badge de zona catastrófica no es visible

  @edge-case @HU-02 @CRITERIO-2.3
  Escenario: Un código postal incompleto de 4 dígitos no dispara la búsqueda en catálogo
    Dado que el panel lateral de edición de la ubicación 1 está abierto en la pestaña "Datos básicos"
    Cuando el agente escribe "0660" en el campo Código Postal (4 dígitos)
    Entonces no se realiza ninguna consulta al servicio de códigos postales
    Y no se muestra ningún mensaje de error en el campo
    Y los campos Estado, Municipio y Colonia permanecen sin cambios

  @edge-case @HU-02
  Esquema del escenario: Validación de formato del código postal
    Dado que el panel lateral de la ubicación 1 está abierto en la pestaña "Datos básicos"
    Cuando el agente escribe "<valor_cp>" en el campo Código Postal
    Entonces el sistema muestra "<resultado_esperado>"
    Y la búsqueda en catálogo "<se_dispara>"

    Ejemplos:
      | valor_cp | resultado_esperado                              | se_dispara   |
      | 06600    | Municipio y estado auto-rellenados              | sí           |
      | 0660     | Sin mensaje de error, sin búsqueda              | no           |
      | 066000   | Sin acción (más de 5 dígitos ignorados)         | no           |
      | 99999    | Código postal no encontrado en el catálogo      | sí (error)   |
      | abcde    | El campo solo acepta dígitos numéricos          | no           |

  ##############################################################################
  # HU-03: Editar giro de negocio y ver clave incendio
  ##############################################################################

  @happy-path @critico @HU-03 @CRITERIO-3.1
  Escenario: La selección de un giro de negocio muestra la card de confirmación con clave incendio
    Dado que el panel lateral de edición está abierto en la pestaña "Giro"
    Y el campo de giro de negocio está vacío
    Cuando el agente selecciona "BL-001 — Bodega de mercancías" en el selector de giro
    Entonces aparece una card de confirmación con el código "BL-001"
    Y la card muestra la descripción "Bodega de mercancías"
    Y la card muestra la clave incendio "FK-INC-01"
    Y la alerta "Clave incendio requerida" desaparece de la lista de alertas bloqueantes

  @error-path @HU-03 @CRITERIO-3.2
  Escenario: La alerta de clave incendio permanece activa cuando no se ha seleccionado giro
    Dado que el panel lateral de edición está abierto en la pestaña "Giro"
    Y el campo de giro de negocio está vacío
    Cuando el agente hace clic en "Guardar ubicación" sin seleccionar ningún giro
    Entonces la alerta "Clave incendio requerida" aparece en el footer del panel lateral
    Y el botón "Guardar ubicación" permanece habilitado (no bloquea el guardado)
    Y la ubicación se guarda con estado "Con alertas"

  ##############################################################################
  # HU-04: Configurar garantías de la ubicación
  ##############################################################################

  @happy-path @critico @HU-04 @CRITERIO-4.1
  Escenario: Activar una garantía habilita el campo de suma asegurada y actualiza el total
    Dado que el panel lateral de edición está abierto en la pestaña "Garantías"
    Y todas las garantías están desactivadas
    Cuando el agente activa el checkbox de "Incendio edificios" e ingresa el valor "5,000,000"
    Entonces el campo de suma asegurada queda habilitado mostrando el valor "5,000,000"
    Y la suma total del footer se actualiza reflejando los $5,000,000
    Y la alerta "Sin garantías tarifables" desaparece

  @error-path @HU-04 @CRITERIO-4.2
  Escenario: La alerta de sin garantías tarifables aparece cuando ninguna garantía está activa
    Dado que el panel lateral de edición está abierto en la pestaña "Garantías"
    Y todas las garantías están desactivadas con suma asegurada en cero
    Cuando el agente visualiza el footer del panel lateral
    Entonces la alerta "Sin garantías tarifables" está activa
    Y la suma total muestra "$0"

  @edge-case @HU-04 @CRITERIO-4.3
  Escenario: Desactivar una garantía limpia automáticamente su suma asegurada
    Dado que la garantía "Incendio edificios" está activa con suma asegurada de "5,000,000"
    Cuando el agente desactiva el checkbox de "Incendio edificios"
    Entonces el campo de suma asegurada se deshabilita
    Y el valor de la suma asegurada se resetea a "0"
    Y la suma total se recalcula excluyendo los $5,000,000 anteriores

  @edge-case @HU-04
  Esquema del escenario: Comportamiento de múltiples garantías activas
    Dado que las garantías "<garantias_activas>" están activas con sus respectivas sumas
    Cuando el agente visualiza el footer del panel lateral
    Entonces la suma total muestra "<suma_esperada>"
    Y la alerta de sin garantías "<alerta_visible>"

    Ejemplos:
      | garantias_activas          | suma_esperada  | alerta_visible |
      | Incendio edificios         | $5,000,000     | no             |
      | Incendio edificios y Robo  | $5,500,000     | no             |
      | Ninguna                    | $0             | sí             |

  ##############################################################################
  # HU-05: Guardar ubicación con control de versión optimista
  ##############################################################################

  @happy-path @critico @HU-05 @CRITERIO-5.1
  Escenario: Guardar una ubicación completa incrementa la versión del folio y cierra el panel
    Dado que la ubicación 1 tiene código postal, giro de negocio y al menos una garantía válidos
    Cuando el agente hace clic en "Guardar ubicación"
    Entonces el sistema envía la actualización parcial de la ubicación 1 con la versión actual del folio
    Y la respuesta del servidor retorna la nueva versión del folio (versión anterior + 1)
    Y el badge de estado del panel lateral cambia a "Completa"
    Y el panel lateral se cierra automáticamente
    Y la tabla de ubicaciones se actualiza reflejando el nuevo estado "Completa"

  @error-path @HU-05 @CRITERIO-5.2
  Escenario: Se muestra un aviso y se recargan los datos cuando hay conflicto de versión al guardar
    Dado que otro proceso actualizó el folio mientras el agente editaba la ubicación 1
    Cuando el agente hace clic en "Guardar ubicación"
    Entonces el sistema recibe un error de conflicto de versión del servidor
    Y se muestra el mensaje "El folio fue modificado por otro proceso. Recargando datos..."
    Y el panel lateral recarga automáticamente la ubicación con los datos más recientes

  @happy-path @HU-05 @CRITERIO-5.3
  Escenario: Guardar una ubicación incompleta no bloquea el flujo y no afecta otras ubicaciones
    Dado que la ubicación 2 no tiene código postal registrado
    Y la ubicación 1 y 3 están en estado "Completa"
    Cuando el agente hace clic en "Guardar ubicación" en el panel de la ubicación 2
    Entonces la ubicación 2 se guarda con estado "Con alertas"
    Y el badge del panel lateral permanece en "Con alertas" mostrando el número de alertas activas
    Y las ubicaciones 1 y 3 mantienen su estado "Completa" sin cambios

  @error-path @HU-05
  Escenario: El sistema no permite guardar una ubicación con un índice que no existe en el folio
    Dado que el folio tiene 3 ubicaciones registradas con índices 1, 2 y 3
    Cuando se intenta actualizar una ubicación con un índice inexistente
    Entonces el servidor retorna un error "Ubicación no encontrada"
    Y el panel lateral muestra un mensaje de error al usuario
    Y no se modifica ninguna ubicación del folio

  ##############################################################################
  # HU-06: Selección múltiple en tabla
  ##############################################################################

  @happy-path @HU-06 @CRITERIO-6.1
  Escenario: El checkbox del encabezado selecciona todas las filas de la tabla
    Dado que la tabla muestra 3 ubicaciones sin ninguna seleccionada
    Cuando el agente hace clic en el checkbox del encabezado de la tabla
    Entonces las 3 filas quedan seleccionadas con el estilo visual resaltado
    Y el checkbox del encabezado muestra estado activo (marcado)

  @edge-case @HU-06
  Escenario: El checkbox del encabezado muestra estado indeterminado con selección parcial
    Dado que la tabla muestra 3 ubicaciones
    Cuando el agente selecciona únicamente la fila de la ubicación 1
    Entonces el checkbox del encabezado muestra el estado "indeterminado"
    Y solo la fila de la ubicación 1 tiene el estilo visual resaltado

  @edge-case @HU-06
  Escenario: Hacer clic en una celda de la tabla (fuera del checkbox) abre el panel de edición
    Dado que la tabla muestra 3 ubicaciones sin el panel lateral abierto
    Cuando el agente hace clic en cualquier celda de la fila de la ubicación 2 (excepto el checkbox)
    Entonces el panel lateral de edición se abre con los datos de la ubicación 2
    Y la selección de la fila no cambia

  ##############################################################################
  # Reglas de negocio complementarias (RN-08, RN-09, RN-10)
  ##############################################################################

  @edge-case @regla-negocio
  Esquema del escenario: Validación del número de niveles de la ubicación
    Dado que el panel lateral está abierto en la pestaña "Construcción"
    Cuando el agente ingresa "<niveles>" en el campo Número de niveles
    Entonces el sistema muestra "<resultado>"

    Ejemplos:
      | niveles | resultado                                  |
      | 1       | Valor aceptado                             |
      | 50      | Valor aceptado                             |
      | 0       | El número de niveles debe ser al menos 1  |
      | 51      | El número de niveles no puede superar 50  |
      | -1      | El número de niveles debe ser al menos 1  |

  @edge-case @regla-negocio
  Esquema del escenario: Validación del año de construcción de la ubicación
    Dado que el panel lateral está abierto en la pestaña "Construcción"
    Cuando el agente ingresa "<año>" en el campo Año de construcción
    Entonces el sistema muestra "<resultado>"

    Ejemplos:
      | año  | resultado                                       |
      | 1900 | Valor aceptado                                  |
      | 2026 | Valor aceptado                                  |
      | 1899 | El año de construcción no puede ser antes de 1900 |
      | 2027 | El año de construcción no puede ser mayor a 2026  |
      | 1950 | Valor aceptado                                  |

  @edge-case @regla-negocio
  Escenario: Solo se puede seleccionar un tipo constructivo a la vez
    Dado que el panel lateral está abierto en la pestaña "Construcción"
    Y el tipo constructivo "Mampostería" está seleccionado
    Cuando el agente selecciona el tipo constructivo "Concreto"
    Entonces el tipo "Concreto" queda seleccionado
    Y el tipo "Mampostería" queda deseleccionado
    Y solo un tipo constructivo puede estar activo a la vez

---

## Tabla de Datos de Prueba Sintéticos

| Escenario | Campo | Valor Válido | Valor Inválido | Valor Borde |
|-----------|-------|-------------|---------------|-------------|
| CRITERIO-1.1 | Folio | FOL-2026-00042 | FOL-9999-XXXXX | — |
| CRITERIO-1.1 | Ubicaciones total | 3 | — | 1 |
| CRITERIO-1.1 | Completas / Incompletas | 2 / 1 | — | 0 / 3 |
| CRITERIO-2.1 | Código postal | 06600 | 99999 | 00000 |
| CRITERIO-2.1 | Estado auto-fill | Ciudad de México | — | — |
| CRITERIO-2.1 | Municipio auto-fill | Cuauhtémoc | — | — |
| CRITERIO-2.1 | Colonias | ["Juárez", "Tabacalera"] | — | lista de 1 elemento |
| CRITERIO-2.1 | Zona catastrófica | ZONE_A | — | — |
| CRITERIO-2.3 | CP incompleto | 06600 (5 dígitos) | 0660 (4 dígitos) | 06600 exacto |
| CRITERIO-3.1 | Código de giro | BL-001 | BL-INVALIDO | — |
| CRITERIO-3.1 | Descripción giro | Bodega de mercancías | — | — |
| CRITERIO-3.1 | Clave incendio | FK-INC-01 | — | — |
| CRITERIO-4.1 | Garantía | GUA-FIRE (Incendio edificios) | — | — |
| CRITERIO-4.1 | Suma asegurada | 5,000,000 | -1 | 0 |
| CRITERIO-4.3 | Suma al desactivar | — | — | 0 (reset) |
| CRITERIO-5.1 | Versión enviada | 4 | — | — |
| CRITERIO-5.1 | Versión recibida | 5 (N+1) | — | — |
| CRITERIO-5.2 | Código error servidor | VERSION_CONFLICT | — | — |
| CRITERIO-6.1 | Total filas tabla | 3 | — | 1 |
| RN-08 | Número de niveles | 1–50 | 0, 51, -1 | 1, 50 |
| RN-09 | Año de construcción | 1900–2026 | 1899, 2027 | 1900, 2026 |
| RN-10 | Tipo constructivo | MASONRY / STEEL / CONCRETE / WOOD / MIXED | — | MIXED |

### Folios de prueba sintéticos

| Folio | Estado | Ubicaciones | Uso |
|-------|--------|-------------|-----|
| FOL-2026-00042 | Activo | 3 (2 COMPLETE, 1 INCOMPLETE) | CRITERIO-1.1, CRITERIO-5.x |
| FOL-2026-00099 | Activo | 3 configuradas, 0 registradas | CRITERIO-1.2 |
| FOL-2026-00010 | Activo | 1 (COMPLETE) | HU-06, pruebas de selección |
| FOL-2026-00055 | Activo | 5 (todas INCOMPLETE) | Escenarios de alertas masivas |

### Códigos postales de prueba sintéticos

| CP | Estado | Estado/Municipio | Colonias | Zona |
|----|--------|-----------------|----------|------|
| 06600 | Válido | CDMX / Cuauhtémoc | Juárez, Tabacalera | ZONE_A, TEV-1, FHM-2 |
| 64000 | Válido | Nuevo León / Monterrey | Centro, Obispado | ZONE_B, TEV-2, FHM-1 |
| 44100 | Válido | Jalisco / Guadalajara | Americana, Moderna | ZONE_C, TEV-1, FHM-3 |
| 99999 | Inválido | — | — | — |
| 00000 | Borde | — | Verificar comportamiento | — |

### Giros de negocio de prueba sintéticos

| Código | Descripción | Clave Incendio |
|--------|-------------|----------------|
| BL-001 | Bodega de mercancías | FK-INC-01 |
| BL-002 | Oficina administrativa | FK-INC-02 |
| BL-003 | Restaurante | FK-INC-03 |
| BL-099 | Uso no especificado | FK-INC-99 |

---

*Generado por: gherkin-case-generator | Spec: SPEC-007 | Fecha: 2026-04-22*
