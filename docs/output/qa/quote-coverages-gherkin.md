# Casos de Prueba Gherkin — Opciones de Cobertura por Ubicación

**Spec de referencia:** SPEC-008 `quote-coverages`
**Fecha de generación:** 2026-04-23
**QA Lead:** ASDD QA Agent
**Estado de la spec:** IMPLEMENTED

---

```gherkin
#language: es
Característica: Configuración de opciones de cobertura por ubicación (Paso 4 del wizard)

  Como agente de cotización
  Quiero configurar las opciones de cobertura (deducibles y coaseguros) de un folio
  Para definir el alcance de la póliza antes del cálculo de prima

  Antecedentes:
    Dado que el agente ha iniciado sesión en el cotizador
    Y existe el folio "FOL-2026-00042" con estado activo
    Y el folio tiene al menos una ubicación registrada

  # ─────────────────────────────────────────────────────────────────────────────
  # CRITERIO-1.1 — Carga de coberturas existentes del folio
  # ─────────────────────────────────────────────────────────────────────────────

  @happy-path @smoke @critico @criterio-1-1
  Escenario: Carga exitosa de coberturas ya persistidas en el folio
    Dado que el folio "FOL-2026-00042" tiene 6 coberturas guardadas con versión 6
      | codigo    | descripcion                        | activa | deducible | coaseguro |
      | COV-FIRE  | Incendio y riesgos adicionales     | si     | 2.0       | 80.0      |
      | COV-CAT   | Cobertura catastrófica CATTEV/CATFHM| no    | 3.0       | 90.0      |
      | COV-THEFT | Robo con violencia                 | no     | 5.0       | 100.0     |
      | COV-BI    | Pérdida de rentas / BI             | si     | 3.0       | 80.0      |
      | COV-ELEC  | Equipo electrónico                 | no     | 10.0      | 100.0     |
      | COV-GLASS | Vidrios                            | no     | 5.0       | 100.0     |
    Cuando el agente navega a la pantalla de información técnica del folio "FOL-2026-00042"
    Entonces se muestran las 6 tarjetas de cobertura en pantalla
    Y la tarjeta "Incendio y riesgos adicionales" muestra deducible "2.0%" y coaseguro "80.0%"
    Y la tarjeta "Incendio y riesgos adicionales" aparece marcada como activa
    Y la tarjeta "Pérdida de rentas / BI" aparece marcada como activa
    Y el contador de coberturas activas en la barra de contexto muestra "2 de 6 coberturas activas"

  @happy-path @smoke @critico @criterio-1-1
  Escenario: El selector de pestañas por ubicación se muestra con las ubicaciones del folio
    Dado que el folio "FOL-2026-00042" tiene coberturas persistidas con versión 3
    Y el folio tiene 3 ubicaciones registradas: "Bodega Norte", "Oficina Central", "Almacén Sur"
    Cuando el agente navega a la pantalla de información técnica del folio "FOL-2026-00042"
    Entonces se muestra una pestaña por cada ubicación: "UBIC 01", "UBIC 02", "UBIC 03"
    Y la primera pestaña "UBIC 01 - Bodega Norte" está activa por defecto


  # ─────────────────────────────────────────────────────────────────────────────
  # CRITERIO-1.2 — Inicialización con valores por defecto cuando coverageOptions vacío
  # ─────────────────────────────────────────────────────────────────────────────

  @happy-path @critico @criterio-1-2
  Escenario: Pantalla se inicializa con el catálogo por defecto cuando el folio es nuevo
    Dado que el folio "FOL-2026-00099" no tiene coberturas guardadas (array vacío)
    Cuando el agente navega a la pantalla de información técnica del folio "FOL-2026-00099"
    Entonces se muestran las 6 tarjetas del catálogo con sus valores por defecto
      | codigo    | descripcion                         | activa | deducible | coaseguro |
      | COV-FIRE  | Incendio y riesgos adicionales      | no     | 2.0       | 80.0      |
      | COV-CAT   | Cobertura catastrófica CATTEV/CATFHM| no     | 3.0       | 90.0      |
      | COV-THEFT | Robo con violencia                  | no     | 5.0       | 100.0     |
      | COV-BI    | Pérdida de rentas / BI              | no     | 3.0       | 80.0      |
      | COV-ELEC  | Equipo electrónico                  | no     | 10.0      | 100.0     |
      | COV-GLASS | Vidrios                             | no     | 5.0       | 100.0     |
    Y ninguna tarjeta de cobertura aparece marcada como activa
    Y el contador de coberturas activas muestra "0 de 6 coberturas activas"

  @happy-path @critico @criterio-1-2
  Escenario: La inicialización por defecto no persiste automáticamente sin acción del agente
    Dado que el folio "FOL-2026-00099" no tiene coberturas guardadas
    Cuando el agente navega a la pantalla de información técnica del folio "FOL-2026-00099"
    Entonces la pantalla muestra los valores por defecto del catálogo
    Y no se realiza ninguna petición de guardado automático al sistema
    Y el botón "Guardar coberturas" está disponible para que el agente lo accione manualmente


  # ─────────────────────────────────────────────────────────────────────────────
  # CRITERIO-1.3 — Guardar coberturas configuradas
  # ─────────────────────────────────────────────────────────────────────────────

  @happy-path @smoke @critico @criterio-1-3
  Escenario: El agente activa una cobertura, ajusta el deducible y guarda exitosamente
    Dado que el folio "FOL-2026-00042" tiene coberturas cargadas con versión 6
    Y la cobertura "Incendio y riesgos adicionales" está desactivada con deducible "2.0%" y coaseguro "80.0%"
    Cuando el agente activa la cobertura "Incendio y riesgos adicionales"
    Y el agente ajusta el deducible a "3.0%"
    Y el agente hace clic en "Guardar coberturas"
    Entonces el sistema envía el array completo de 6 coberturas con la versión "6"
    Y la cobertura "Incendio y riesgos adicionales" queda guardada como activa con deducible "3.0%"
    Y la versión en el estado local se actualiza a "7"
    Y se muestra la notificación de éxito "Coberturas guardadas correctamente"

  @happy-path @smoke @critico @criterio-1-3
  Escenario: Guardar un conjunto de coberturas sin cambios actualiza la versión correctamente
    Dado que el folio "FOL-2026-00042" tiene coberturas cargadas con versión 6
    Y el agente no ha modificado ninguna cobertura
    Cuando el agente hace clic en "Guardar coberturas"
    Entonces el sistema envía el array de coberturas con la versión "6"
    Y la versión local se actualiza al nuevo valor devuelto por el servidor
    Y se muestra la notificación de éxito "Coberturas guardadas correctamente"

  @happy-path @critico @criterio-1-3
  Escenario: Guardar coberturas con múltiples coberturas activas
    Dado que el folio "FOL-2026-00042" tiene coberturas cargadas con versión 4
    Cuando el agente activa las coberturas "Incendio y riesgos adicionales", "Robo con violencia" y "Vidrios"
    Y el agente ajusta el coaseguro de "Robo con violencia" a "80%"
    Y el agente hace clic en "Guardar coberturas"
    Entonces el sistema guarda las 3 coberturas activas y 3 inactivas en el mismo array
    Y se muestra la notificación de éxito "Coberturas guardadas correctamente"
    Y el contador de coberturas activas refleja "3 de 6 coberturas activas"


  # ─────────────────────────────────────────────────────────────────────────────
  # CRITERIO-1.4 — Aplicar configuración a todas las ubicaciones
  # ─────────────────────────────────────────────────────────────────────────────

  @happy-path @criterio-1-4
  Escenario: Aplicar configuración de la pestaña activa a todas las pestañas
    Dado que el folio "FOL-2026-00042" tiene 3 ubicaciones: "Bodega Norte", "Oficina Central", "Almacén Sur"
    Y el agente está en la pestaña de la ubicación 2 "Oficina Central"
    Y tiene 4 coberturas activas configuradas en esa pestaña
    Cuando el agente hace clic en "Aplicar a todas"
    Entonces la configuración de la pestaña 2 se refleja visualmente en las pestañas 1 y 3
    Y todas las pestañas muestran el mismo contador "4 de 6 coberturas activas"
    Y el estado del array de coberturas en memoria es consistente con la configuración aplicada
    Y no se realiza ninguna petición de guardado automático al sistema

  @happy-path @criterio-1-4
  Escenario: La operación "Aplicar a todas" no persiste hasta que el agente guarde manualmente
    Dado que el folio "FOL-2026-00042" tiene 2 ubicaciones
    Y el agente está en la pestaña de la ubicación 1 con 3 coberturas activas
    Cuando el agente hace clic en "Aplicar a todas"
    Y el agente no hace clic en "Guardar coberturas"
    Entonces el sistema no realiza ninguna petición PUT al servicio de coberturas
    Y los cambios visuales están en memoria sin persistir


  # ─────────────────────────────────────────────────────────────────────────────
  # CRITERIO-1.5 — Copiar configuración desde otra ubicación
  # ─────────────────────────────────────────────────────────────────────────────

  @happy-path @criterio-1-5
  Escenario: El agente copia la configuración desde una ubicación de origen a la pestaña activa
    Dado que el folio "FOL-2026-00042" tiene 3 ubicaciones: "Bodega Norte", "Oficina Central", "Almacén Sur"
    Y la ubicación 1 "Bodega Norte" tiene 5 coberturas activas con sus deducibles configurados
    Y el agente está en la pestaña de la ubicación 3 "Almacén Sur" con 0 coberturas activas
    Cuando el agente selecciona "Bodega Norte" en el selector "Copiar desde:"
    Entonces la pestaña 3 muestra la misma configuración que la pestaña 1
    Y el contador de la pestaña 3 muestra "5 de 6 coberturas activas"
    Y la modificación es solo en memoria (no persiste automáticamente)

  @happy-path @criterio-1-5
  Escenario: El selector "Copiar desde" muestra las demás ubicaciones excepto la activa
    Dado que el folio "FOL-2026-00042" tiene 3 ubicaciones: "Bodega Norte", "Oficina Central", "Almacén Sur"
    Y el agente está en la pestaña de la ubicación 2 "Oficina Central"
    Cuando el agente visualiza el selector "Copiar desde:"
    Entonces el selector muestra las opciones "Bodega Norte" y "Almacén Sur"
    Y la opción "Oficina Central" no aparece en el selector (no se puede copiar desde sí misma)

  @happy-path @criterio-1-5
  Escenario: Copiar configuración no realiza guardado automático
    Dado que el folio "FOL-2026-00042" tiene 2 ubicaciones: "Planta Principal", "Sucursal Centro"
    Y el agente está en la pestaña de la ubicación 2 "Sucursal Centro"
    Cuando el agente selecciona "Planta Principal" en el selector "Copiar desde:"
    Y el agente no hace clic en "Guardar coberturas"
    Entonces el sistema no realiza ninguna petición PUT al servicio de coberturas


  # ─────────────────────────────────────────────────────────────────────────────
  # CRITERIO-1.6 — Conflicto de versión optimista (409)
  # ─────────────────────────────────────────────────────────────────────────────

  @error-path @criterio-1-6
  Escenario: El agente intenta guardar coberturas con una versión desactualizada
    Dado que el folio "FOL-2026-00042" tiene coberturas cargadas con versión local "5"
    Y otro proceso actualizó el folio y la versión actual en el servidor es "8"
    Y el agente ha activado la cobertura "Incendio y riesgos adicionales"
    Cuando el agente hace clic en "Guardar coberturas"
    Entonces el servidor responde con código de error "conflicto de versión"
    Y la pantalla muestra el mensaje "Los datos han cambiado en otro proceso. Recarga para continuar."
    Y el botón "Guardar coberturas" permanece habilitado para reintentar
    Y el estado local de las coberturas no es modificado por el error

  @error-path @criterio-1-6
  Escenario: El mensaje de conflicto de versión desaparece al recargar los datos
    Dado que se mostró el mensaje de conflicto de versión en pantalla
    Cuando el agente recarga la pantalla del folio "FOL-2026-00042"
    Entonces el mensaje de conflicto ya no se muestra
    Y las coberturas se cargan con los valores actuales del servidor
    Y la versión local se sincroniza con la versión actual del servidor


  # ─────────────────────────────────────────────────────────────────────────────
  # CRITERIO-1.7 — Error de red al cargar coberturas
  # ─────────────────────────────────────────────────────────────────────────────

  @error-path @criterio-1-7
  Escenario: El backend no está disponible al cargar la pantalla de coberturas
    Dado que el servicio de coberturas no está disponible en este momento
    Cuando el agente navega a la pantalla de información técnica del folio "FOL-2026-00042"
    Entonces la pantalla muestra el mensaje de error "No se pudieron cargar las coberturas. Intenta de nuevo."
    Y se muestra un botón "Reintentar" visible en pantalla
    Y no se muestran tarjetas de cobertura

  @error-path @criterio-1-7
  Escenario: El agente reintenta la carga exitosamente después de un error de red
    Dado que se mostró el error "No se pudieron cargar las coberturas. Intenta de nuevo."
    Y el servicio de coberturas ya está disponible
    Cuando el agente hace clic en el botón "Reintentar"
    Entonces el sistema consulta nuevamente las coberturas del folio "FOL-2026-00042"
    Y se muestran las 6 tarjetas de cobertura con sus valores persistidos
    Y el mensaje de error ya no se muestra en pantalla

  @error-path @criterio-1-7
  Escenario: El agente reintenta la carga pero el servicio sigue sin responder
    Dado que se mostró el error "No se pudieron cargar las coberturas. Intenta de nuevo."
    Y el servicio de coberturas continúa sin estar disponible
    Cuando el agente hace clic en el botón "Reintentar"
    Entonces el sistema muestra nuevamente el mensaje de error
    Y el botón "Reintentar" sigue visible para un nuevo intento


  # ─────────────────────────────────────────────────────────────────────────────
  # CRITERIO-1.8 — Desactivar cobertura deshabilita sus campos de edición
  # ─────────────────────────────────────────────────────────────────────────────

  @edge-case @criterio-1-8
  Escenario: Desactivar una cobertura activa deshabilita visualmente sus campos
    Dado que el folio "FOL-2026-00042" tiene la cobertura "Robo con violencia" activa
    Y esa cobertura tiene deducible "5.0%" y coaseguro "100.0%"
    Cuando el agente desactiva el switch de la cobertura "Robo con violencia"
    Entonces el cuerpo de la tarjeta "Robo con violencia" se muestra con opacidad reducida
    Y los campos de deducible y coaseguro de esa tarjeta no son editables
    Y el badge "Activa" desaparece del encabezado de la tarjeta
    Y el encabezado de la tarjeta pierde el fondo de color de acento
    Y los valores "5.0%" y "100.0%" se conservan (no se borran al desactivar)

  @edge-case @criterio-1-8
  Escenario: Reactivar una cobertura previamente desactivada restaura los valores originales
    Dado que la cobertura "Robo con violencia" fue desactivada con valores deducible "5.0%" y coaseguro "100.0%"
    Cuando el agente reactiva el switch de la cobertura "Robo con violencia"
    Entonces el cuerpo de la tarjeta vuelve a ser interactivo y visible sin opacidad reducida
    Y el badge "Activa" aparece en el encabezado de la tarjeta
    Y los campos muestran los valores previos "5.0%" y "100.0%"

  @edge-case @criterio-1-8
  Esquema del escenario: Verificar el estado visual de tarjetas según su activación
    Dado que la cobertura "<nombre_cobertura>" está en estado "<estado_inicial>"
    Cuando el agente cambia el estado de la cobertura a "<nuevo_estado>"
    Entonces el body de la tarjeta muestra "<estado_interactivo>"
    Y el badge "Activa" está "<visibilidad_badge>"

    Ejemplos:
      | nombre_cobertura               | estado_inicial | nuevo_estado | estado_interactivo | visibilidad_badge |
      | Incendio y riesgos adicionales | activa         | inactiva     | deshabilitado      | oculto            |
      | Cobertura catastrófica CATTEV  | inactiva       | activa       | habilitado         | visible           |
      | Equipo electrónico             | activa         | inactiva     | deshabilitado      | oculto            |
      | Vidrios                        | inactiva       | activa       | habilitado         | visible           |


  # ─────────────────────────────────────────────────────────────────────────────
  # CRITERIO-1.9 — Solo 1 ubicación: "Aplicar a todas" deshabilitado
  # ─────────────────────────────────────────────────────────────────────────────

  @edge-case @criterio-1-9
  Escenario: Con una sola ubicación el botón "Aplicar a todas" está deshabilitado
    Dado que el folio "FOL-2026-00077" tiene exactamente 1 ubicación registrada: "Casa Matriz"
    Y el folio tiene coberturas cargadas con versión 2
    Cuando el agente navega a la pantalla de información técnica del folio "FOL-2026-00077"
    Entonces el botón "Aplicar a todas" está presente en la pantalla
    Y el botón "Aplicar a todas" está deshabilitado (no es posible hacer clic)

  @edge-case @criterio-1-9
  Escenario: Con una sola ubicación el selector "Copiar desde" no aparece en pantalla
    Dado que el folio "FOL-2026-00077" tiene exactamente 1 ubicación registrada: "Casa Matriz"
    Y el folio tiene coberturas cargadas con versión 2
    Cuando el agente navega a la pantalla de información técnica del folio "FOL-2026-00077"
    Entonces el selector "Copiar desde:" no es visible en la pantalla

  @edge-case @criterio-1-9
  Escenario: Con más de una ubicación el botón "Aplicar a todas" está habilitado
    Dado que el folio "FOL-2026-00042" tiene 3 ubicaciones registradas
    Cuando el agente navega a la pantalla de información técnica del folio "FOL-2026-00042"
    Entonces el botón "Aplicar a todas" está presente y habilitado
    Y el selector "Copiar desde:" es visible en la barra de contexto


  # ─────────────────────────────────────────────────────────────────────────────
  # Escenarios adicionales de validación de campos
  # ─────────────────────────────────────────────────────────────────────────────

  @edge-case @validacion-campos
  Esquema del escenario: Verificar el step de los campos numéricos de cobertura
    Dado que el folio "FOL-2026-00042" tiene coberturas cargadas
    Y la cobertura "<nombre_cobertura>" está activa
    Cuando el agente modifica el campo "<campo>" en la tarjeta de esa cobertura
    Entonces el campo acepta incrementos de "<step_esperado>"

    Ejemplos:
      | nombre_cobertura               | campo      | step_esperado |
      | Incendio y riesgos adicionales | deducible  | 0.5           |
      | Incendio y riesgos adicionales | coaseguro  | 5             |
      | Robo con violencia             | deducible  | 0.5           |
      | Robo con violencia             | coaseguro  | 5             |
```

---

## Tabla de Datos de Prueba Sintéticos

### Folios de prueba

| ID Prueba | Folio          | Descripcion                               | Coberturas   | Versión | Ubicaciones |
|-----------|----------------|-------------------------------------------|--------------|---------|-------------|
| TD-F-01   | FOL-2026-00042 | Folio activo con coberturas persistidas   | 6 coberturas | 6       | 3           |
| TD-F-02   | FOL-2026-00099 | Folio nuevo sin coberturas (array vacío)  | []           | 1       | 2           |
| TD-F-03   | FOL-2026-00077 | Folio con una sola ubicación              | 6 coberturas | 2       | 1           |
| TD-F-04   | FOL-2026-00055 | Folio con versión obsoleta (conflicto)    | 6 coberturas | 5 (local) / 8 (servidor) | 2 |

### Coberturas por folio TD-F-01 (FOL-2026-00042)

| Codigo    | Descripcion                          | Activa | Deducible (%) | Coaseguro (%) |
|-----------|--------------------------------------|--------|---------------|---------------|
| COV-FIRE  | Incendio y riesgos adicionales       | si     | 2.0           | 80.0          |
| COV-CAT   | Cobertura catastrófica CATTEV/CATFHM | no     | 3.0           | 90.0          |
| COV-THEFT | Robo con violencia                   | no     | 5.0           | 100.0         |
| COV-BI    | Pérdida de rentas / BI               | si     | 3.0           | 80.0          |
| COV-ELEC  | Equipo electrónico                   | no     | 10.0          | 100.0         |
| COV-GLASS | Vidrios                              | no     | 5.0           | 100.0         |

### Coberturas por defecto (catálogo) — usadas en TD-F-02

| Codigo    | Descripcion                          | Activa | Deducible (%) | Coaseguro (%) |
|-----------|--------------------------------------|--------|---------------|---------------|
| COV-FIRE  | Incendio y riesgos adicionales       | no     | 2.0           | 80.0          |
| COV-CAT   | Cobertura catastrófica CATTEV/CATFHM | no     | 3.0           | 90.0          |
| COV-THEFT | Robo con violencia                   | no     | 5.0           | 100.0         |
| COV-BI    | Pérdida de rentas / BI               | no     | 3.0           | 80.0          |
| COV-ELEC  | Equipo electrónico                   | no     | 10.0          | 100.0         |
| COV-GLASS | Vidrios                              | no     | 5.0           | 100.0         |

### Ubicaciones de prueba

| Folio          | Indice | Nombre           | Uso en escenario                       |
|----------------|--------|------------------|----------------------------------------|
| FOL-2026-00042 | 1      | Bodega Norte     | Origen de "Copiar desde", CRITERIO-1.5 |
| FOL-2026-00042 | 2      | Oficina Central  | Tab activa en CRITERIO-1.4             |
| FOL-2026-00042 | 3      | Almacén Sur      | Destino de copia en CRITERIO-1.5       |
| FOL-2026-00077 | 1      | Casa Matriz      | Única ubicación en CRITERIO-1.9        |
| FOL-2026-00099 | 1      | Planta Principal | Folio nuevo, CRITERIO-1.2              |
| FOL-2026-00099 | 2      | Sucursal Centro  | Segunda ubicación, CRITERIO-1.2        |

### Respuestas de error simuladas

| Codigo HTTP | Codigo de error   | Mensaje                             | Escenario que lo usa |
|-------------|-------------------|-------------------------------------|----------------------|
| 409         | VERSION_CONFLICT  | Optimistic lock conflict            | CRITERIO-1.6         |
| 404         | FOLIO_NOT_FOUND   | Folio not found                     | Carga 404            |
| 422         | VALIDATION_ERROR  | Validation failed                   | Guardado inválido    |
| 0 / timeout | (sin respuesta)   | No se pudieron cargar las coberturas| CRITERIO-1.7         |

---

## Resumen de cobertura por criterio

| Criterio   | Etiqueta principal       | Escenarios totales | Happy | Error | Edge |
|------------|--------------------------|-------------------|-------|-------|------|
| CRITERIO-1.1 | @smoke @critico        | 2                 | 2     | 0     | 0    |
| CRITERIO-1.2 | @critico               | 2                 | 2     | 0     | 0    |
| CRITERIO-1.3 | @smoke @critico        | 3                 | 3     | 0     | 0    |
| CRITERIO-1.4 | @happy-path            | 2                 | 2     | 0     | 0    |
| CRITERIO-1.5 | @happy-path            | 3                 | 3     | 0     | 0    |
| CRITERIO-1.6 | @error-path            | 2                 | 0     | 2     | 0    |
| CRITERIO-1.7 | @error-path            | 3                 | 0     | 3     | 0    |
| CRITERIO-1.8 | @edge-case             | 3 (+4 esquema)    | 0     | 0     | 7    |
| CRITERIO-1.9 | @edge-case             | 3                 | 0     | 0     | 3    |
| Validación campos | @edge-case        | 4 (esquema)       | 0     | 0     | 4    |
| **TOTAL**  |                          | **27**            | **12**| **5** | **14** |
