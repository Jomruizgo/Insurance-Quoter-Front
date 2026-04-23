#language: es
# SPEC-006 — Configuración de Layout de Ubicaciones (Paso 2 de 5)
# Generado: 2026-04-22
# Criterios cubiertos: CRITERIO-1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4

Característica: Configuración de layout de ubicaciones en el wizard de cotización

  Como agente autenticado en el paso 2 del wizard de cotización
  Quiero configurar el número y tipo de ubicaciones del folio
  Para que el sistema use esta configuración como plantilla en el paso de ubicaciones

  Antecedentes:
    Dado que el agente está autenticado en el sistema
    Y existe el folio "FOL-2026-00042" en estado activo

  # ---------------------------------------------------------------------------
  # HU-01: Cargar configuración de layout existente
  # ---------------------------------------------------------------------------

  @smoke @critico @CRITERIO-1.1
  Escenario: Cargar layout guardado previamente al navegar al paso 2
    Dado que el folio "FOL-2026-00042" tiene una configuración de layout guardada
      con 3 ubicaciones y tipo de distribución "Múltiples ubicaciones"
    Cuando el agente navega al paso "Layout" del folio "FOL-2026-00042"
    Entonces el formulario muestra el valor 3 en el campo de número de ubicaciones
    Y el radio card "Múltiples ubicaciones" aparece resaltado con borde primario e ícono de verificación
    Y los demás radio cards aparecen sin seleccionar

  @edge-case @CRITERIO-1.2
  Escenario: Mostrar formulario vacío cuando el folio no tiene layout configurado
    Dado que el folio "FOL-2026-00099" no tiene configuración de layout guardada
    Cuando el agente navega al paso "Layout" del folio "FOL-2026-00099"
    Entonces el campo de número de ubicaciones aparece vacío
    Y ningún radio card de tipo de ubicación está seleccionado
    Y el botón "Guardar y continuar" está deshabilitado

  @error-path @CRITERIO-1.3
  Escenario: Mostrar mensaje de error no bloqueante cuando el backend no responde al cargar
    Dado que el servicio de backend no está disponible (timeout o error 5xx)
    Cuando el agente navega al paso "Layout" del folio "FOL-2026-00042"
    Entonces se muestra un mensaje de error no bloqueante indicando el fallo de carga
    Y el formulario permanece visible y usable con los campos vacíos
    Y el agente puede intentar ingresar datos manualmente

  # ---------------------------------------------------------------------------
  # HU-02: Guardar configuración de layout
  # ---------------------------------------------------------------------------

  @smoke @critico @CRITERIO-2.1
  Escenario: Guardar layout válido y avanzar al paso de ubicaciones
    Dado que el agente está en el paso "Layout" del folio "FOL-2026-00042"
    Y el agente ha ingresado 5 en el campo de número de ubicaciones
    Y el agente ha seleccionado el radio card "Ubicaciones distribuidas"
    Cuando el agente hace clic en "Guardar y continuar"
    Entonces el sistema envía la configuración al servidor con los datos correctos y la versión actual
    Y el paso "Layout" en el stepper queda marcado como completado
    Y el agente es redirigido automáticamente al paso 3 "Ubicaciones"

  @error-path @CRITERIO-2.2
  Escenario: Mostrar advertencia de conflicto de versión cuando el folio fue modificado desde otra sesión
    Dado que el agente está en el paso "Layout" del folio "FOL-2026-00042"
    Y el folio fue modificado por otra sesión mientras el agente completaba el formulario
    Y el agente ha ingresado 2 en el campo de número de ubicaciones
    Y el agente ha seleccionado el radio card "Ubicación única"
    Cuando el agente hace clic en "Guardar y continuar"
    Entonces el sistema muestra el mensaje "El folio fue modificado desde otra sesión. Recarga la página para continuar."
    Y el formulario permanece en el paso "Layout" sin navegar al siguiente paso
    Y los datos ingresados por el agente se conservan en el formulario

  @error-path @CRITERIO-2.3
  Esquema del escenario: Mostrar error de validación cuando el número de ubicaciones está fuera del rango permitido
    Dado que el agente está en el paso "Layout" del folio "FOL-2026-00042"
    Y el agente ha seleccionado el radio card "Múltiples ubicaciones"
    Y el agente ingresa el valor "<valor_ingresado>" en el campo de número de ubicaciones
    Cuando el agente intenta hacer clic en "Guardar y continuar"
    Entonces el campo de número de ubicaciones muestra el error "El número de ubicaciones debe estar entre 1 y 50"
    Y no se realiza ninguna llamada al servidor
    Y el agente permanece en el paso "Layout"

    Ejemplos:
      | valor_ingresado | descripcion               |
      | 0               | límite inferior excedido  |
      | -1              | valor negativo            |
      | 51              | límite superior excedido  |
      | 100             | valor muy alto            |
      | 0.5             | decimal no permitido      |

  @error-path @CRITERIO-2.4
  Escenario: Mostrar error cuando no se ha seleccionado un tipo de ubicación
    Dado que el agente está en el paso "Layout" del folio "FOL-2026-00042"
    Y el agente ha ingresado 3 en el campo de número de ubicaciones
    Y el agente no ha seleccionado ningún radio card de tipo de ubicación
    Cuando el agente intenta hacer clic en "Guardar y continuar"
    Entonces se muestra el error "Selecciona un tipo de ubicación"
    Y no se realiza ninguna llamada al servidor
    Y el agente permanece en el paso "Layout"

  # ---------------------------------------------------------------------------
  # Casos borde adicionales — Reglas de Negocio
  # ---------------------------------------------------------------------------

  @edge-case
  Escenario: Verificar que el texto informativo de plantilla es siempre visible en el formulario
    Dado que el agente está en el paso "Layout" del folio "FOL-2026-00042"
    Cuando el formulario carga correctamente
    Entonces el texto "Este layout se replicará como plantilla al registrar ubicaciones. Podrás sobrescribirlo ubicación por ubicación." es visible en el formulario

  @edge-case
  Escenario: Guardar layout con el valor mínimo permitido de ubicaciones
    Dado que el agente está en el paso "Layout" del folio "FOL-2026-00042"
    Y el agente ha ingresado 1 en el campo de número de ubicaciones
    Y el agente ha seleccionado el radio card "Ubicación única"
    Cuando el agente hace clic en "Guardar y continuar"
    Entonces el sistema envía la configuración al servidor con numberOfLocations igual a 1 y locationType "SINGLE"
    Y el paso "Layout" queda marcado como completado
    Y el agente es redirigido al paso 3 "Ubicaciones"

  @edge-case
  Escenario: Guardar layout con el valor máximo permitido de ubicaciones
    Dado que el agente está en el paso "Layout" del folio "FOL-2026-00042"
    Y el agente ha ingresado 50 en el campo de número de ubicaciones
    Y el agente ha seleccionado el radio card "Ubicaciones distribuidas"
    Cuando el agente hace clic en "Guardar y continuar"
    Entonces el sistema envía la configuración al servidor con numberOfLocations igual a 50 y locationType "DISTRIBUTED"
    Y el paso "Layout" queda marcado como completado
    Y el agente es redirigido al paso 3 "Ubicaciones"

# ---------------------------------------------------------------------------
# Tabla de datos de prueba de referencia
# ---------------------------------------------------------------------------
# | Escenario                  | Campo               | Válido       | Inválido      | Borde         |
# |----------------------------|---------------------|--------------|---------------|---------------|
# | Cargar layout guardado     | numberOfLocations   | 3            | -             | -             |
# | Cargar layout guardado     | locationType        | MULTIPLE     | -             | -             |
# | Guardar layout válido      | numberOfLocations   | 5            | 0, 51         | 1, 50         |
# | Guardar layout válido      | locationType        | DISTRIBUTED  | (vacío)       | SINGLE        |
# | Conflicto de versión       | version             | 3 (sync)     | 2 (desync)    | -             |
# | Rango numérico inválido    | numberOfLocations   | 1–50         | 0,-1,51,100   | 0.5 (decimal) |
# | Sin tipo seleccionado      | locationType        | SINGLE       | null/undefined| -             |
