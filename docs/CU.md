# Especificación de Casos de Uso (CU)

## Sistema de Información y Gestión para el Comedor Comunitario Pan para Todos (SIG-CCPT)

---

### CU-01: Control de Acceso y Autenticación (RBAC)
* **Requerimientos Asociados:** RF-04
* **Actores Principales:** Coordinadora, Presidente JAC, Voluntario, Donante.
* **Precondición:** El usuario cuenta con credenciales activas asignadas por la Coordinación.
* **Postcondición:** El usuario ingresa a una sesión segura con acceso restringido exclusivamente a las vistas y funciones asignadas a su rol.

#### Flujo Principal
1. El usuario abre la aplicación e introduce sus credenciales (nombre de usuario/correo y contraseña).
2. El sistema valida las credenciales contra el repositorio centralizado de identidades.
3. El sistema identifica el rol operativo del usuario (Coordinadora, Presidente JAC, Voluntario, Donante).
4. El sistema inicializa la sesión cargando únicamente el menú y los módulos autorizados para dicho rol.
5. El sistema presenta el panel inicial adaptado a su perfil.

#### Flujos Alternativos
* **2a. Credenciales incorrectas o usuario inactivo:**
  1. El sistema muestra mensaje de error sin revelar si el dato fallido fue el usuario o la contraseña.
  2. Se registra el intento fallido en la bitácora de seguridad.
* **4a. Intento de acceso a recurso no autorizado (403 Forbidden):**
  1. El sistema bloquea la navegación, muestra advertencia de permisos insuficientes y audita la acción.

---

### CU-02: Administrar Cuentas de Usuario
* **Requerimientos Asociados:** RF-25
* **Actores Principales:** Coordinadora.
* **Precondición:** La Coordinadora tiene una sesión activa y validada.
* **Postcondición:** La cuenta de usuario es creada, modificada o inactivada lógicamente (*soft delete*).

#### Flujo Principal
1. La Coordinadora accede a la vista de "Gestión de Usuarios".
2. El sistema despliega el listado de colaboradores con estado y rol asignado.
3. La Coordinadora selecciona crear un nuevo usuario o editar uno existente.
4. Diligencia o actualiza los datos obligatorios (nombre, correo/usuario, teléfono y rol en el sistema).
5. Confirma la acción de guardado.
6. El sistema valida la no duplicidad del identificador/correo, guarda los cambios y genera la auditoría.
7. El sistema notifica la finalización exitosa de la operación.

#### Flujos Alternativos
* **3a. Baja / Inactivación de usuario:**
  1. La Coordinadora selecciona la opción "Inactivar cuenta" sobre un usuario.
  2. El sistema solicita confirmación del motivo.
  3. Al confirmar, el sistema realiza baja lógica (cambio a estado inactivo) para conservar la trazabilidad de auditoría histórica sin eliminar registros de base de datos.
* **3b. Intento de auto-inactivación:**
  1. El sistema detecta que la Coordinadora intenta inactivar su propia sesión y bloquea la operación con aviso preventivo.

---

### CU-03: Registrar Oferta y Recepción de Donación
* **Requerimientos Asociados:** RF-11
* **Actores Principales:** Donante, Coordinadora.
* **Precondición:** El donante está registrado o la Coordinadora inicia la captura en campo.
* **Postcondición:** La oferta u orden de donación queda asentada y disponible para ingreso a bodega.

#### Flujo Principal
1. El Donante registra una oferta de donación indicando ítems y cantidad estimada.
2. La Coordinadora recibe la notificación, revisa la capacidad de almacenamiento y acepta o rechaza la donación.
3. Al arribar la donación al comedor, la Coordinadora valida los insumos e ingresa el peso final.
4. La Coordinadora marca explícitamente si el peso es "medido" (mediante báscula) o "estimado" (conteo por bulto/caja).
5. El sistema confirma la recepción e ingresa los productos al stock disponible.

#### Flujos Alternativos
* **2a. Capacidad de inventario colapsada:**
  1. La Coordinadora rechaza la oferta indicando motivo y el sistema envía notificación formal de agradecimiento y no aceptación al donante.

---

### CU-04: Generar Recibo de Donación
* **Requerimientos Asociados:** RF-12
* **Actores Principales:** Donante, Coordinadora.
* **Precondición:** Donación recibida formalmente en bodega.
* **Postcondición:** Se genera un recibo digital descargable con validez institucional.

#### Flujo Principal
1. El Donante o la Coordinadora selecciona una donación ingresada y solicita comprobante.
2. El sistema recopila datos del aportante, fecha de recepción, ítems y pesaje (marcando si es medido o estimado).
3. El sistema compila el recibo/certificado digital descargable en formato PDF.
4. El comprobante queda a disposición del donante para descarga inmediata o consulta posterior.

---

### CU-05: Registrar Descarte de Alimentos
* **Requerimientos Asociados:** RF-05
* **Actores Principales:** Coordinadora (Autorizadora y Registradora), Voluntario/Cocinero (Evaluador técnico).
* **Precondición:** Insumos registrados en existencias.
* **Postcondición:** El inventario se descuenta y se asienta el registro inmutable de merma.

#### Flujo Principal
1. La Coordinadora ingresa al módulo de "Descartes y Mermas" y pulsa "Nuevo Registro".
2. Selecciona el lote/producto y digita la cantidad y unidad de medida a descartar.
3. Selecciona el motivo estandarizado (vencimiento, mal estado, empaque roto, etc.).
4. Diligencia opcionalmente el campo "Evaluado por" indicando el criterio del cocinero o voluntario.
5. El sistema autocompleta el campo vinculante y obligatorio "Autorizado por" con el identificador de la Coordinadora en sesión.
6. La Coordinadora confirma la transacción.
7. El sistema verifica que la cantidad a descartar sea menor o igual al stock, descuenta las existencias y genera la marca temporal inmutable.

#### Flujos Alternativos
* **7a. Cantidad excede existencia:**
  1. El sistema impide el registro y señala discrepancia de stock.

---

### CU-06: Generar Acta de Descarte y Evidencia de Merma Corporativa
* **Requerimientos Asociados:** RF-06, RF-17
* **Actores Principales:** Coordinadora, Voluntario, Donante Corporativo.
* **Precondición:** Descarte de alimento procesado o en formulación de acta.
* **Postcondición:** Acta formal generada con vinculación a lote de origen y fotografía de merma.

#### Flujo Principal
1. El usuario busca la donación de origen mediante su identificador o lote.
2. Adjunta soporte fotográfico del empaque o producto destruido/inutilizado.
3. El sistema valida si el donante asociado es corporativo:
   - Si es Corporativo: la fotografía y el acta con código de trazabilidad son obligatorias.
   - Si es Donante Vecinal/Comunitario: el soporte fotográfico permanece como opcional.
4. El sistema emite el acta de descarte trazable para evitar descuadres contables y la deja disponible en el panel del donante correspondiente.

---

### CU-07: Control de Inventario y Alertas de Caducidad (FEFO)
* **Requerimientos Asociados:** RF-08, RF-09
* **Actores Principales:** Coordinadora, Voluntario de cocina.
* **Precondición:** Alimentos registrados con fecha de vencimiento declarada.
* **Postcondición:** Alertas visuales desplegadas para priorizar uso en cocina.

#### Flujo Principal
1. El sistema evalúa permanentemente las fechas de vencimiento de los lotes almacenados.
2. Identifica productos próximos a caducar según el umbral de días parametrizado.
3. El sistema resalta los lotes críticos mediante alertas preventivas bajo el principio FEFO (*First Expired, First Out*).
4. El personal de cocina consulta las prioridades de consumo al planear la minuta diaria.

---

### CU-08: Registrar Incidente de Cadena de Frío
* **Requerimientos Asociados:** RF-10
* **Actores Principales:** Voluntario, Coordinadora.
* **Precondición:** Equipos de refrigeración o congelación registrados en el sistema.
* **Postcondición:** Se reporta la anomalía térmica y se marca en riesgo el lote contenido.

#### Flujo Principal
1. El usuario detecta falla eléctrica o aumento no programado de temperatura en nevera/congelador.
2. Accede a "Registro de Incidentes de Frío" y selecciona el electrodoméstico afectado.
3. Especifica duración estimada de la falla, temperatura registrada y lote de alimentos comprometido.
4. El sistema asocia el incidente y emite alerta sobre los productos que requieren verificación bromatológica inmediata antes de consumo.

---

### CU-09: Registrar Beneficiario con Datos Sensibles Segmentados
* **Requerimientos Asociados:** RF-01, RF-02, RF-24
* **Actores Principales:** Voluntario en puerta/reja, Coordinadora.
* **Precondición:** Jornada de atención abierta.
* **Postcondición:** Registro único asentado en la base de datos sin duplicidad entre reja y cocina.

#### Flujo Principal
1. El voluntario consulta al beneficiario por documento o nombre.
2. Al verificar que no existe en el sistema, despliega el formulario de registro.
3. Selecciona el nivel de captura:
   - **Básico:** Nombre completo y campo opcional de procedencia barrial (sin carácter restrictivo).
   - **Extendido:** Cédula, teléfono y clasificación Sisbén (solo si el propósito del trámite lo requiere).
4. Guarda el registro.
5. El sistema aplica validación de unicidad en BD, consolida la ficha única centralizada y confirma el guardado.

#### Flujos Alternativos
* **2a. Beneficiario ya existente:**
  1. El sistema advierte que el registro ya existe, despliega su ficha y bloquea la creación duplicada.

---

### CU-10: Generar y Controlar Turno de Atención en Fila
* **Requerimientos Asociados:** RF-03
* **Actores Principales:** Voluntario en puerta ("la reja").
* **Precondición:** Beneficiario registrado; jornada operativa activa.
* **Postcondición:** Turno secuencial emitido y beneficiario en cola de espera.

#### Flujo Principal
1. El voluntario localiza al beneficiario en el padrón centralizado.
2. Solicita emitir turno de atención.
3. El sistema comprueba que no tenga un turno expedido previamente en la misma fecha.
4. Asigna el siguiente consecutivo diario y lo coloca en estado "En Espera".
5. Emite el tiquete digital o impreso y el voluntario comunica el número.

#### Flujos Alternativos
* **3a. Turno previamente asignado en el día:**
  1. El sistema emite alerta indicando que el beneficiario ya recibió turno en la jornada, evitando la entrega de raciones duplicadas. Permite únicamente la reimpresión por extravío comprobado.

---

### CU-11: Registrar Excepciones de Entrega
* **Requerimientos Asociados:** RF-07
* **Actores Principales:** Coordinadora, Voluntario de entrega.
* **Precondición:** Beneficiario atendido en fila.
* **Postcondición:** Asiento registrado con justificación y usuario responsable.

#### Flujo Principal
1. El operador detecta una necesidad especial (ración adicional o mercado para familia numerosa).
2. Abre la ficha de entrega y marca "Registrar Excepción".
3. Diligencia obligatoriamente la justificación del caso.
4. Vincula al responsable administrativo que autorizó la ración complementaria.
5. El sistema almacena la excepción con marca temporal y la descuenta del consolidado de raciones.

---

### CU-12: Gestionar Convocatorias y Tareas de Voluntariado
* **Requerimientos Asociados:** RF-13, RF-14, RF-15
* **Actores Principales:** Coordinadora, Voluntario.
* **Precondición:** Planificación de jornada de servicio.
* **Postcondición:** Cuadrilla de voluntarios confirmada con tareas y checklist asignados.

#### Flujo Principal
1. La Coordinadora publica turnos operativos requeridos para la semana.
2. Los voluntarios registran su disponibilidad horaria desde la app.
3. La Coordinadora asigna tareas específicas por puesto (puerta/acceso, lavado de menaje, servido en mesa).
4. El voluntario nuevo consulta la checklist digital de inducción para conocer normas de higiene y operación en su primera jornada.

---

### CU-13: Gestionar Consentimiento de Imagen y Protección de Menores
* **Requerimientos Asociados:** RF-19, RF-20, RF-21
* **Actores Principales:** Voluntario, Coordinadora, Tutor Legal.
* **Precondición:** Registro de beneficiario abierto.
* **Postcondición:** Marcas de consentimiento de datos y restricciones de captura aplicadas.

#### Flujo Principal
1. Al capturar al beneficiario por primera vez, el sistema exige asentar la casilla de consentimiento informado (Habeas Data).
2. Se registra el consentimiento de uso de imagen bajo esquema opt-in (bloqueado por defecto).
3. Si el beneficiario es menor de edad, el sistema activa automáticamente una bandera de protección estricta.
4. Se bloquea la toma o inclusión de cualquier fotografía del menor a menos que se adjunte autorización firmada por tutor legal con documento de identidad.

---

### CU-14: Configurar Políticas de Retención y Purga de Datos
* **Requerimientos Asociados:** RF-22
* **Actores Principales:** Coordinadora.
* **Precondición:** Sesión de Coordinación activa.
* **Postcondición:** Parámetros de ciclo de vida de registros establecidos en el motor de base de datos.

#### Flujo Principal
1. La Coordinadora accede a "Políticas de Retención".
2. Establece el tiempo de vida (TTL) para registros históricos y bitácoras operativas.
3. Confirma la configuración de borrado programado.
4. El sistema programa los barridos periódicos y deja asiento en el log de auditoría.

---

### CU-15: Generar Reportes Agregados y Exportación Normativa
* **Requerimientos Asociados:** RF-16, RF-17, RF-18
* **Actores Principales:** Coordinadora, Presidente JAC, Donante.
* **Precondición:** Registros consolidados en el periodo.
* **Postcondición:** Reportes anonimizados o archivos .xlsx exportados sin vulnerar la privacidad.

#### Flujo Principal
1. El actor solicita el reporte respectivo según su perfil:
   - **Presidente JAC:** Reporte de cobertura barrial consolidado y fotos de contexto sin rostros visibles.
   - **Donante:** Reporte de balance de sus propias donaciones (recibido / usado / descartado), sin vincular personas individuales.
   - **Presidente JAC:** Consulta del balance total de donaciones, sin marcas de donantes.
   - **Presidente JAC:** Exportación en Excel (.xlsx estándar OOXML) con el esquema oficial de la Alcaldía, para entregarla a la Alcaldía de Pereira.
   - **Coordinadora:** Reportes agregados de gestión para la JAC y de trazabilidad para los donantes, sin identidades individuales.
2. Al generar el archivo de la Alcaldía, el sistema filtra y excluye automáticamente a los beneficiarios que no otorgaron consentimiento expreso para dicho reporte.
3. El sistema genera el archivo y lo descarga de forma segura.

---

## Tabla Resumen de Casos de Uso

| Código | Nombre del Caso de Uso | Actores Principales | Requerimientos Asociados |
| :--- | :--- | :--- | :--- |
| **CU-01** | Control de Acceso y Autenticación (RBAC) | Coordinadora, Presidente JAC, Voluntario, Donante | RF-04 |
| **CU-02** | Administrar Cuentas de Usuario | Coordinadora | RF-25 |
| **CU-03** | Registrar Oferta y Recepción de Donación | Donante, Coordinadora | RF-11 |
| **CU-04** | Generar Recibo de Donación | Donante, Coordinadora | RF-12 |
| **CU-05** | Registrar Descarte de Alimentos | Coordinadora, Voluntario/Cocinero | RF-05 |
| **CU-06** | Generar Acta de Descarte y Evidencia de Merma Corporativa | Coordinadora, Voluntario, Donante Corporativo | RF-06 |
| **CU-07** | Control de Inventario y Alertas de Caducidad (FEFO) | Coordinadora, Voluntario de cocina | RF-08, RF-09 |
| **CU-08** | Registrar Incidente de Cadena de Frío | Voluntario, Coordinadora | RF-10 |
| **CU-09** | Registrar Beneficiario con Datos Sensibles Segmentados | Voluntario en puerta/reja, Coordinadora | RF-01, RF-02, RF-24 |
| **CU-10** | Generar y Controlar Turno de Atención en Fila | Voluntario en puerta ("la reja") | RF-03 |
| **CU-11** | Registrar Excepciones de Entrega | Coordinadora, Voluntario de entrega | RF-07 |
| **CU-12** | Gestionar Convocatorias y Tareas de Voluntariado | Coordinadora, Voluntario | RF-13, RF-14, RF-15 |
| **CU-13** | Gestionar Consentimiento de Imagen y Protección de Menores | Voluntario, Coordinadora, Tutor Legal | RF-19, RF-20, RF-21 |
| **CU-14** | Configurar Políticas de Retención y Purga de Datos | Coordinadora | RF-22 |
| **CU-15** | Generar Reportes Agregados y Exportación Normativa | Coordinadora, Presidente JAC, Donante | RF-16, RF-17, RF-18 |

