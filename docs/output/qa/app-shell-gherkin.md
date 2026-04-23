# Escenarios Gherkin — App Shell (SPEC-003)

> Feature: `app-shell` | Generado: 2026-04-22
> Criterios cubiertos: CRITERIO-1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1

---

```gherkin
#language: es
Característica: App Shell — Layout estructural del cotizador de daños

  # ─────────────────────────────────────────────────────────────
  # HU-01: Header global de la aplicación
  # ─────────────────────────────────────────────────────────────

  @smoke @critico @criterio-1.1
  Escenario: Header visible con elementos completos en ruta de dashboard
    Dado que el usuario ha iniciado sesión como "María López" con rol "Suscriptora"
    Cuando navega a la ruta "/cotizador"
    Entonces el encabezado muestra el logo "IQ" y la marca "Sofka IQ / Cotizador de Daños"
    Y el breadcrumb muestra únicamente el texto "Cotizaciones"
    Y el breadcrumb NO muestra ningún número de folio
    Y el campo de búsqueda tiene el placeholder "Buscar…"
    Y el atajo de teclado "⌘K" es visible junto al buscador
    Y se muestra el avatar con el nombre "María López" y el rol "Suscriptora"

  @smoke @critico @criterio-1.2
  Escenario: Breadcrumb muestra folio activo al navegar a una ruta de cotización
    Dado que el usuario ha iniciado sesión
    Y existe el folio "FOL-2026-00042" en el sistema
    Cuando navega a la ruta "/quotes/FOL-2026-00042/general-info"
    Entonces el breadcrumb muestra "Cotizaciones"
    Y el breadcrumb muestra el separador "›"
    Y el breadcrumb muestra "FOL-2026-00042" resaltado como sección activa

  @edge-case @criterio-1.2
  Escenario: Breadcrumb vuelve a mostrar solo "Cotizaciones" al regresar al dashboard
    Dado que el usuario está en "/quotes/FOL-2026-00042/general-info"
    Cuando navega de regreso a "/cotizador"
    Entonces el breadcrumb muestra únicamente el texto "Cotizaciones"
    Y el folio "FOL-2026-00042" ya no aparece en el breadcrumb


  # ─────────────────────────────────────────────────────────────
  # HU-02: Stepper de progreso del folio
  # ─────────────────────────────────────────────────────────────

  @smoke @critico @criterio-2.1
  Escenario: Stepper muestra íconos correctos según el estado de cada sección
    Dado que el usuario navega a "/quotes/FOL-2026-00042/general-info"
    Cuando el servicio de estado retorna:
      | sección         | estado     |
      | Datos generales | COMPLETE   |
      | Layout          | COMPLETE   |
      | Ubicaciones     | INCOMPLETE |
      | Coberturas      | PENDING    |
      | Cálculo         | PENDING    |
    Entonces el paso "Datos generales" muestra el ícono de confirmación (check)
    Y el paso "Layout" muestra el ícono de confirmación (check)
    Y el paso "Ubicaciones" muestra el ícono de alerta
    Y el paso "Coberturas" muestra el número "4"
    Y el paso "Cálculo" muestra el número "5"

  @smoke @critico @criterio-2.2
  Escenario: Clic en un paso del Stepper navega a la ruta correspondiente
    Dado que el usuario está en "/quotes/FOL-2026-00042/general-info"
    Y el Stepper está visible con el paso "Ubicaciones" habilitado
    Cuando el usuario hace clic en el paso "Ubicaciones"
    Entonces el sistema navega a "/quotes/FOL-2026-00042/locations"
    Y el paso "Ubicaciones" queda marcado como activo en el Stepper

  @edge-case @criterio-2.3
  Escenario: Stepper NO se renderiza en la ruta del dashboard
    Dado que el usuario ha iniciado sesión
    Cuando navega a la ruta "/cotizador"
    Entonces el componente "StepperComponent" NO está presente en el DOM
    Y ningún paso del proceso de cotización es visible

  @edge-case
  Escenario: Stepper refleja paso activo según la URL actual
    Dado que el usuario está en "/quotes/FOL-2026-00042/locations"
    Cuando el Stepper se renderiza
    Entonces el paso "Ubicaciones" aparece resaltado como el paso activo
    Y los demás pasos NO aparecen resaltados como activos


  # ─────────────────────────────────────────────────────────────
  # HU-03: Barra de estado del folio activo
  # ─────────────────────────────────────────────────────────────

  @smoke @critico @criterio-3.1
  Escenario: StatusBar muestra los datos reales del folio activo
    Dado que el usuario está en "/quotes/FOL-2026-00042/locations"
    Cuando el servicio de estado retorna completionPercentage "75" y estado "EN PROCESO"
    Entonces la barra de estado muestra el folio "FOL-2026-00042"
    Y la insignia de estado refleja "En proceso"
    Y la barra de progreso Sparkline representa el 75%
    Y el texto "75% completado" es visible
    Y se muestra la versión y la fecha de última actualización

  @edge-case @criterio-3.2
  Escenario: StatusBar NO se renderiza en la ruta del dashboard
    Dado que el usuario ha iniciado sesión
    Cuando navega a la ruta "/cotizador"
    Entonces el componente "StatusBarComponent" NO está presente en el DOM
    Y la barra de estado inferior NO es visible


  # ─────────────────────────────────────────────────────────────
  # HU-04: Modal de creación de folio
  # ─────────────────────────────────────────────────────────────

  @smoke @critico @criterio-4.1
  Escenario: Creación exitosa de folio navega al paso Datos generales
    Dado que el usuario está en el dashboard "/cotizador"
    Y el modal de creación de folio está abierto
    Y el catálogo muestra los suscriptores disponibles
    Cuando el usuario selecciona el suscriptor "Seguros del Norte S.A."
    Y selecciona el agente "Carlos Herrera"
    Y hace clic en el botón "Crear folio"
    Entonces el sistema llama al servicio con suscriptor "SUB-001" y agente "AGT-123"
    Y el modal se cierra automáticamente
    Y el sistema navega a "/quotes/FOL-2026-00042/general-info"
    Y el breadcrumb muestra el folio "FOL-2026-00042"

  @smoke @critico @criterio-4.2
  Escenario: Lista de agentes se filtra automáticamente al seleccionar suscriptor
    Dado que el modal de creación de folio está abierto
    Y existen agentes para distintos suscriptores:
      | agente          | suscriptor  |
      | Carlos Herrera  | SUB-001     |
      | Ana Martínez    | SUB-001     |
      | Roberto Díaz    | SUB-002     |
    Cuando el usuario selecciona el suscriptor "Seguros del Norte S.A." (SUB-001)
    Entonces el selector de agentes muestra solo "Carlos Herrera" y "Ana Martínez"
    Y "Roberto Díaz" NO aparece en la lista de agentes

  @smoke @critico @criterio-4.2
  Escenario: Selección de otro suscriptor actualiza la lista de agentes
    Dado que el usuario ya seleccionó el suscriptor "SUB-001" con su agente
    Cuando cambia al suscriptor "Aseguradora Central" (SUB-002)
    Entonces el selector de agentes se limpia
    Y muestra únicamente los agentes asociados a "SUB-002"

  @error-path @criterio-4.3
  Escenario: Error del backend al crear folio muestra mensaje al usuario
    Dado que el modal de creación de folio está abierto
    Y el usuario tiene suscriptor y agente seleccionados
    Cuando el usuario hace clic en "Crear folio"
    Y el servicio responde con error 400 "Suscriptor o agente inválido"
    Entonces el modal permanece abierto
    Y se muestra el mensaje "Suscriptor o agente inválido" en el área de alertas
    Y el botón "Crear folio" vuelve a estar habilitado
    Y el usuario puede reintentar la operación

  @edge-case @criterio-4.3
  Escenario: Botón "Crear folio" se deshabilita durante la petición en curso
    Dado que el modal está abierto con suscriptor y agente seleccionados
    Cuando el usuario hace clic en "Crear folio"
    Y la petición HTTP está en curso (pendiente)
    Entonces el botón "Crear folio" aparece deshabilitado con texto "Creando…"
    Y el usuario no puede volver a hacer clic en el botón

  @edge-case @critico @criterio-4.4
  Escenario: Respuesta 200 idempotente navega igual que la respuesta 201
    Dado que ya existe un folio "FOL-2026-00042" creado para los mismos parámetros
    Y el modal de creación de folio está abierto con esos mismos datos
    Cuando el usuario hace clic en "Crear folio"
    Y el servicio responde con HTTP 200 y folioNumber "FOL-2026-00042"
    Entonces el modal se cierra
    Y el sistema navega a "/quotes/FOL-2026-00042/general-info"
    Y el comportamiento es idéntico al de la creación HTTP 201


  # ─────────────────────────────────────────────────────────────
  # HU-05: MainLayout orquesta visibilidad condicional
  # ─────────────────────────────────────────────────────────────

  @smoke @critico @criterio-5.1
  Escenario: Stepper y StatusBar se muestran al navegar a una ruta de folio
    Dado que el usuario está en el dashboard "/cotizador"
    Y los componentes Stepper y StatusBar NO son visibles
    Cuando el sistema navega a "/quotes/FOL-2026-00042/general-info"
    Entonces el componente "StepperComponent" aparece en el DOM
    Y el componente "StatusBarComponent" aparece en el DOM

  @smoke @critico @criterio-5.1
  Escenario: Stepper y StatusBar desaparecen al volver al dashboard
    Dado que el usuario está en "/quotes/FOL-2026-00042/general-info"
    Y los componentes Stepper y StatusBar son visibles
    Cuando el sistema navega a "/cotizador"
    Entonces el componente "StepperComponent" NO está en el DOM
    Y el componente "StatusBarComponent" NO está en el DOM
    Y el Header continúa visible

  @edge-case @criterio-5.1
  Escenario: Navegación rápida entre rutas mantiene consistencia de visibilidad
    Dado que el usuario está en "/quotes/FOL-2026-00042/general-info"
    Cuando navega rápidamente entre "general-info" → "/cotizador" → "locations"
    Entonces Stepper y StatusBar están presentes al estar en rutas de folio
    Y Stepper y StatusBar están ausentes al estar en "/cotizador"
    Y no se producen errores de renderizado ni estados inconsistentes
```

---

## Datos de Prueba Sintéticos

| Escenario           | Campo         | Valor válido                | Valor inválido          | Borde                      |
|---------------------|---------------|-----------------------------|-------------------------|----------------------------|
| Crear folio         | subscriberId  | `SUB-001`                   | `SUB-999` (inexistente) | Cadena vacía `""`          |
| Crear folio         | agentCode     | `AGT-123`                   | `AGT-999` (inexistente) | Agente de otro suscriptor  |
| Estado del folio    | folioNumber   | `FOL-2026-00042`            | `FOL-DOES-NOT-EXIST`    | Folio con estado `ISSUED`  |
| Completitud         | completionPercentage | `75`               | N/A                     | `0` y `100` (extremos)     |
| SectionStatus       | sección       | `COMPLETE`, `INCOMPLETE`    | N/A                     | `PENDING` (estado inicial) |
| Filtro de agentes   | subscriberId  | `SUB-001` (con 2 agentes)   | `SUB-003` (sin agentes) | Suscriptor sin agentes     |

### Catálogo de prueba

**Suscriptores:**
```json
[
  { "id": "SUB-001", "name": "Seguros del Norte S.A." },
  { "id": "SUB-002", "name": "Aseguradora Central" }
]
```

**Agentes:**
```json
[
  { "code": "AGT-123", "name": "Carlos Herrera",   "subscriberId": "SUB-001" },
  { "code": "AGT-124", "name": "Ana Martínez",     "subscriberId": "SUB-001" },
  { "code": "AGT-201", "name": "Roberto Díaz",     "subscriberId": "SUB-002" }
]
```

**QuoteState de prueba:**
```json
{
  "folioNumber": "FOL-2026-00042",
  "quoteStatus": "IN_PROGRESS",
  "completionPercentage": 75,
  "sections": {
    "generalInfo":    "COMPLETE",
    "layout":         "COMPLETE",
    "locations":      "INCOMPLETE",
    "coverageOptions":"PENDING",
    "calculation":    "PENDING"
  },
  "version": 2,
  "updatedAt": "2026-04-22T10:00:00Z"
}
```
