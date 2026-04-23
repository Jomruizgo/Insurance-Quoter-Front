# Feature: Datos Generales de la Cotización (Paso 1 de 5)
# Spec: SPEC-005 | Feature: quote-general-info
# Generado por: QA Lead ASDD | Fecha: 2026-04-22
# Criterios cubiertos: CRITERIO-1.1, CRITERIO-1.2, CRITERIO-1.3, CRITERIO-1.4,
#                      CRITERIO-2.1, CRITERIO-2.2, CRITERIO-2.3, CRITERIO-3.1

Feature: Captura y validación de datos generales en el Paso 1 del wizard de cotización
  Como agente autenticado en el cotizador
  Quiero capturar los datos del asegurado y los datos de suscripción
  Para identificar al titular y asignar la responsabilidad técnica antes de continuar al Paso 2

  Background:
    Given el agente está autenticado en el sistema
    And existe el folio "FOL-2026-00042" con estado "IN_PROGRESS" y version 2
    And el catálogo de suscriptores contiene:
      | id      | nombre           |
      | SUB-001 | Suscriptor Uno   |
      | SUB-002 | Suscriptor Dos   |
    And el catálogo de agentes contiene:
      | código  | subscriberId |
      | AGT-123 | SUB-001      |
      | AGT-456 | SUB-002      |
    And el agente navega a "/quotes/FOL-2026-00042/general-info"

  # ─────────────────────────────────────────────────────────────────
  # HU-01 — Capturar datos del asegurado
  # ─────────────────────────────────────────────────────────────────

  # CRITERIO-1.1: Guardar datos del asegurado válidos
  Scenario: CRITERIO-1.1 — Guardar datos del asegurado válidos con version optimista
    Given el formulario muestra la version actual "2" en la alerta de suscripción
    When el agente completa el campo "Razón social" con "Empresa Ejemplo SA de CV"
    And el agente completa el campo "RFC" con "EEJ900101ABC"
    And el agente completa el campo "Correo" con "contacto@empresa.com"
    And el agente completa el campo "Teléfono" con "5512345678"
    And el agente selecciona "SUB-001" en el select de suscriptor
    And el agente selecciona "AGT-123" en el select de agente
    And el agente selecciona "STANDARD" en clasificación de riesgo
    And el agente selecciona "COMMERCIAL" en tipo de negocio
    And el agente pulsa el botón "Guardar"
    Then se realiza una solicitud PUT a "/v1/quotes/FOL-2026-00042/general-info" con el cuerpo:
      """json
      {
        "insuredData": {
          "name": "Empresa Ejemplo SA de CV",
          "rfc": "EEJ900101ABC",
          "email": "contacto@empresa.com",
          "phone": "5512345678"
        },
        "underwritingData": {
          "subscriberId": "SUB-001",
          "agentCode": "AGT-123",
          "riskClassification": "STANDARD",
          "businessType": "COMMERCIAL"
        },
        "version": 2
      }
      """
    And el backend responde 200 con version 3
    And el campo version en el componente se actualiza a 3
    And la alerta informativa muestra "Versionado optimista activo — versión actual: v3"
    And el agente es redirigido a "/quotes/FOL-2026-00042/layout"

  # CRITERIO-1.2: Campos obligatorios vacíos al intentar avanzar
  Scenario: CRITERIO-1.2 — No guardar cuando los campos del asegurado están vacíos
    Given el formulario tiene todos los campos del asegurado vacíos
    When el agente pulsa el botón "Guardar"
    Then el campo "Razón social" muestra el mensaje "Campo obligatorio"
    And el campo "RFC" muestra el mensaje "Campo obligatorio"
    And el campo "Correo" muestra el mensaje "Campo obligatorio"
    And el campo "Teléfono" muestra el mensaje "Campo obligatorio"
    And no se realiza ninguna solicitud HTTP al backend

  # CRITERIO-1.3: RFC con formato inválido
  Scenario: CRITERIO-1.3 — Mostrar error de validación cuando el RFC tiene formato inválido
    Given el agente está posicionado en el campo "RFC"
    When el agente escribe "abc123" en el campo "RFC"
    And el campo "RFC" pierde el foco
    Then el campo "RFC" muestra el mensaje "RFC inválido — debe tener entre 12 y 13 caracteres alfanuméricos"
    And no se realiza ninguna solicitud HTTP al backend

  Scenario Outline: CRITERIO-1.3 — RFC inválido en múltiples formatos incorrectos
    Given el agente está posicionado en el campo "RFC"
    When el agente escribe "<rfc_invalido>" en el campo "RFC"
    And el campo "RFC" pierde el foco
    Then el campo "RFC" muestra el mensaje "RFC inválido — debe tener entre 12 y 13 caracteres alfanuméricos"

    Examples:
      | rfc_invalido    | descripcion                  |
      | abc123          | demasiado corto              |
      | AAAAA900101AAAA | demasiado largo (14 chars)   |
      | 123456789012    | solo dígitos                 |
      | EEJ-900101-ABC  | contiene guiones             |

  # CRITERIO-1.4: RFC se fuerza a mayúsculas al tipear
  Scenario: CRITERIO-1.4 — El campo RFC convierte automáticamente a mayúsculas en tiempo real
    Given el agente está posicionado en el campo "RFC"
    When el agente escribe "xaxx010101000" en el campo "RFC"
    Then el campo "RFC" muestra el valor "XAXX010101000"
    And el FormControl del RFC almacena el valor "XAXX010101000"

  # ─────────────────────────────────────────────────────────────────
  # HU-02 — Seleccionar datos de suscripción con filtrado dinámico
  # ─────────────────────────────────────────────────────────────────

  # CRITERIO-2.1: Filtrar agentes al cambiar suscriptor
  Scenario: CRITERIO-2.1 — El select de agentes se filtra al seleccionar un suscriptor
    Given el catálogo tiene los agentes "AGT-123" (SUB-001) y "AGT-456" (SUB-002)
    When el agente selecciona "SUB-001" en el select de suscriptor
    Then el select de agentes muestra únicamente la opción "AGT-123"
    And la opción "AGT-456" no está disponible en el select de agentes

  Scenario: CRITERIO-2.1 — El campo agente se limpia si el agente previo no pertenece al nuevo suscriptor
    Given el agente ha seleccionado "SUB-001" y "AGT-123" previamente
    When el agente cambia el suscriptor a "SUB-002"
    Then el select de agentes muestra únicamente la opción "AGT-456"
    And el campo agente queda vacío (valor limpiado)

  # CRITERIO-2.2: Seleccionar clasificación de riesgo y tipo de negocio
  Scenario: CRITERIO-2.2 — El badge de completitud cambia a Completo al llenar suscripción
    Given el agente tiene todos los selects de suscripción disponibles
    When el agente selecciona "SUB-001" en suscriptor
    And el agente selecciona "AGT-123" en agente
    And el agente selecciona "STANDARD" en clasificación de riesgo
    And el agente selecciona "COMMERCIAL" en tipo de negocio
    Then el FormGroup de underwritingData tiene los valores:
      | campo              | valor      |
      | subscriberId       | SUB-001    |
      | agentCode          | AGT-123    |
      | riskClassification | STANDARD   |
      | businessType       | COMMERCIAL |
    And el badge de completitud de la tarjeta "Suscripción" muestra el estado "Completo"

  Scenario Outline: CRITERIO-2.2 — Combinaciones válidas de clasificación y tipo de negocio
    When el agente selecciona "<clasificacion>" en clasificación de riesgo
    And el agente selecciona "<tipo_negocio>" en tipo de negocio
    Then los valores quedan reflejados en el formulario reactivo

    Examples:
      | clasificacion | tipo_negocio |
      | STANDARD      | COMMERCIAL   |
      | PREFERRED     | INDUSTRIAL   |
      | SUBSTANDARD   | RESIDENTIAL  |

  # CRITERIO-2.3: Suscriptor no seleccionado al intentar guardar
  Scenario: CRITERIO-2.3 — Mostrar error cuando el suscriptor está vacío al guardar
    Given el select de suscriptor está vacío
    And todos los demás campos del asegurado están correctamente completados
    When el agente pulsa el botón "Guardar"
    Then el select de suscriptor muestra el mensaje "Campo obligatorio"
    And no se realiza ninguna solicitud HTTP al backend

  # ─────────────────────────────────────────────────────────────────
  # HU-03 — Gestionar conflicto de versión optimista
  # ─────────────────────────────────────────────────────────────────

  # CRITERIO-3.1: Conflicto de versión (409 VERSION_CONFLICT)
  Scenario: CRITERIO-3.1 — Mostrar mensaje de conflicto cuando el backend retorna 409 VERSION_CONFLICT
    Given el agente tiene el formulario completamente válido con version 2
    And otro usuario ya guardó el folio incrementando la versión a 3
    When el agente pulsa el botón "Guardar" (enviando version 2)
    Then el backend responde 409 con el cuerpo:
      """json
      {
        "error": "Optimistic lock conflict",
        "code": "VERSION_CONFLICT"
      }
      """
    And se muestra el mensaje "El folio fue modificado por otra sesión. Recarga para obtener la versión actual."
    And el formulario no se limpia ni se reinicia
    And el agente permanece en la página "/quotes/FOL-2026-00042/general-info"
