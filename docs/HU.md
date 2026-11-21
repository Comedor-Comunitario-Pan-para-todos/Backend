# Product Backlog: Historias de Usuario (HU)

## Sistema de Información y Gestión para el Comedor Comunitario Pan para Todos (SIG-CCPT)

---

> La numeración de las historias es la del SRS (fuente oficial). Las historias se agrupan por módulo, así que dentro de un módulo los números pueden no ser consecutivos (HU-26 a HU-29 se agregaron después sin renumerar las existentes).

---

### Módulo 1: Seguridad, Cuentas y Control de Acceso (RBAC)

#### HU-01: Administración de cuentas de usuario
* **Código:** HU-01
* **Requerimiento Asociado:** RF-25
* **Caso de Uso:** CU-02

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora** | crear, modificar roles e inactivar cuentas de usuario en el sistema | controlar estrictamente quién tiene acceso a la plataforma según la rotación de voluntarios y colaboradores. |

**Criterios de Aceptación:**
1. Dado que la Coordinadora accede al panel de usuarios, cuando crea una cuenta, entonces debe asignarle obligatoriamente uno de los roles autorizados (Voluntario, Presidente JAC, Donante o Coordinadora).
2. Dado que se da de baja a un voluntario o directivo saliente, cuando se ejecuta la baja, entonces el sistema aplica una inactivación lógica (*soft delete*), bloqueando nuevos inicios de sesión sin alterar el historial de auditoría de transacciones pasadas.
3. Dado que la Coordinadora navega sobre su propia cuenta activa, entonces el sistema bloquea cualquier intento de auto-inactivación o degradación de rol.

---

#### HU-02: Inicio de sesión y control de acceso por rol (RBAC)
* **Código:** HU-02
* **Requerimiento Asociado:** RF-04
* **Caso de Uso:** CU-01

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Usuario del sistema (Voluntario, JAC, Donante o Coordinadora)** | iniciar sesión con mis credenciales y visualizar exclusivamente los módulos autorizados para mi perfil | realizar mis tareas operativas sin comprometer la seguridad ni acceder a datos sensibles restringidos. |

**Criterios de Aceptación:**
1. Dado que un usuario ingresa credenciales válidas, cuando el sistema lo autentica, entonces renderiza únicamente las vistas y botones autorizados para su rol operativo.
2. Dado que el usuario con rol Voluntario inicia sesión, entonces solo tiene habilitado el padrón de beneficiarios básico y la emisión de turnos.
3. Dado que el usuario con rol Donante accede al sistema, entonces solo visualiza estadísticas de impacto de sus aportes y descarga de actas de merma propias, sin acceso al padrón de personas.
4. Dado que un usuario no autorizado intenta forzar el acceso a una ruta protegida mediante la URL, el sistema responde con error 403 y audita el incidente en la bitácora.

---

### Módulo 2: Gestión de Insumos y Logística de Donaciones

#### HU-03: Registro de oferta de donación por aportante
* **Código:** HU-03
* **Requerimiento Asociado:** RF-11
* **Caso de Uso:** CU-03

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Donante** | registrar una oferta de donación indicando ítems y cantidades estimadas desde la app | notificar con anticipación al comedor y coordinar la recepción sin generar sobrecupos. |

**Criterios de Aceptación:**
1. Dado que el Donante ingresa al módulo de donaciones, cuando registra una oferta, el sistema valida que los campos ítem, cantidad estimada y fecha proyectada estén completos.
2. El sistema remite una confirmación de registro al donante informando que la oferta está en evaluación por Coordinación.

---

#### HU-04: Gestión y recepción de donación por Coordinación
* **Código:** HU-04
* **Requerimiento Asociado:** RF-11
* **Caso de Uso:** CU-03

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora** | recibir notificaciones de nuevas donaciones, verificar cupo en bodega y asentar el ingreso físico con su pesaje | mantener un control centralizado del inventario y resolver la falta de báscula mediante pesajes estimados. |

**Criterios de Aceptación:**
1. Dado que la Coordinadora evalúa una donación ofertada, cuando verifica el stock físico en bodega, puede aceptarla o rechazarla con justificación técnica.
2. Dado que se recibe físicamente la donación en el comedor, cuando la Coordinadora registra el ingreso final, debe especificar obligatoriamente si el peso fue "medido" (en báscula) o "estimado" (conteo por bultos/cajas).
3. Una vez confirmada la recepción, los ítems se cargan automáticamente a las existencias disponibles.

---

#### HU-05: Emisión de recibo o certificado de donación
* **Código:** HU-05
* **Requerimiento Asociado:** RF-12
* **Caso de Uso:** CU-04

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora o Donante** | generar y descargar un recibo o certificado digital de donación | certificar el aporte recibido con fines de respaldo contable e institucional. |

**Criterios de Aceptación:**
1. Dado que una donación se encuentra en estado recibida, cuando se pulsa "Generar Recibo", el sistema compila un documento digital en formato PDF descargable.
2. El documento detalla fecha, razón social o nombre del aportante, lista de insumos y condición de pesaje (medido o estimado), con sello/código digital del comedor.

---

#### HU-06: Registro formal de descarte de alimentos
* **Código:** HU-06
* **Requerimiento Asociado:** RF-05
* **Caso de Uso:** CU-05

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora** | registrar la baja de alimentos especificando cantidad, motivo, evaluador físico y mi autorización obligatoria | mantener el stock al día y asegurar que cada merma cuente con un responsable administrativo claro. |

**Criterios de Aceptación:**
1. Dado que se descartan alimentos, el formulario exige obligatoriamente: Lote, Cantidad, Unidad de medida y Motivo predefinido (vencimiento, mal estado, empaque averiado).
2. El campo "Evaluado por" permite registrar de forma informativa el dictamen del cocinero o voluntario que detectó el daño.
3. El campo "Autorizado por" es obligatorio, no ambiguo y se fija exclusivamente con el usuario activo con rol de Coordinadora.
4. El sistema rechaza cualquier registro cuya cantidad a descartar sea mayor al stock disponible en bodega.

---

#### HU-07: Adjuntar evidencia fotográfica para merma corporativa
* **Código:** HU-07
* **Requerimiento Asociado:** RF-06
* **Caso de Uso:** CU-06

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora** | adjuntar obligatoriamente fotos del producto inutilizado cuando provenga de un donante corporativo | generar el acta digital requerida por las auditorías de supermercados sin fotografiar personas. |

**Criterios de Aceptación:**
1. Dado que el lote a descartar procede de un donante corporativo, cuando se diligencia la baja, el sistema inhabilita el guardado hasta que se adjunte al menos una foto de la caja o alimento deteriorado.
2. Dado que el lote procede de vecinos o donantes comunitarios, la carga de fotografía se mantiene como opcional.
3. El sistema prohíbe la inclusión de fotografías donde figuren rostros humanos o menores de edad.

---

#### HU-08: Consulta de descartes y actas de merma por donantes
* **Código:** HU-08
* **Requerimiento Asociado:** RF-06, RF-17
* **Caso de Uso:** CU-06

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Donante corporativo** | consultar el registro de descartes de mis aportes y descargar las actas trazables | sustentar contablemente ante la auditoría interna de mi empresa la merma de productos entregados. |

**Criterios de Aceptación:**
1. Dado que un donante corporativo ingresa a su sección de auditoría, únicamente puede visualizar los descartes originados en sus propias donaciones.
2. Cada acta desplegada incluye código trazable, fecha, peso descartado, motivo, autorización y soporte fotográfico del insumo.
3. El sistema no revela datos de beneficiarios en ningún componente del acta.

---

### Módulo 3: Control de Insumos y Monitoreo Preventivo

#### HU-09: Registro y control de inventario de insumos
* **Código:** HU-09
* **Requerimiento Asociado:** RF-08
* **Caso de Uso:** CU-07

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora o Voluntario de cocina** | consultar y registrar insumos en stock asociando fecha de recepción y fecha de caducidad declarada | conocer la disponibilidad de alimentos y evitar el vencimiento desapercibido en estantes. |

**Criterios de Aceptación:**
1. Al ingresar un insumo a bodega, se debe capturar fecha de ingreso y fecha de caducidad informada por el donante.
2. La vista de inventario consolida saldos por categoría y permite búsquedas ágiles por texto o lote.

---

#### HU-10: Alertas preventivas de caducidad (FEFO)
* **Código:** HU-10
* **Requerimiento Asociado:** RF-09
* **Caso de Uso:** CU-07

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora o Cocinero** | recibir alertas automáticas sobre alimentos próximos a su fecha de vencimiento | priorizar la preparación de insumos críticos bajo el criterio FEFO y prevenir desperdicios. |

**Criterios de Aceptación:**
1. El sistema resalta en color preventivo aquellos lotes cuya fecha de caducidad se encuentre dentro de los días de alerta parametrizados.
2. Las alertas actúan como soporte de recomendación técnica, manteniendo la decisión final en el equipo de cocina.

---

#### HU-11: Registro de incidentes en cadena de frío
* **Código:** HU-11
* **Requerimiento Asociado:** RF-10
* **Caso de Uso:** CU-08

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario o Coordinadora** | registrar novedades o fallos térmicos en los equipos de refrigeración y congelación | alertar sobre lotes de carnes o lácteos que hayan quedado en riesgo sanitario por pérdida de frío. |

**Criterios de Aceptación:**
1. El formulario solicita: electrodoméstico afectado, fecha/hora estimada del corte de energía o daño, y alimentos afectados.
2. El sistema asocia una marca de advertencia en el stock a los productos alojados en el equipo reportado hasta su verificación técnica.

---

### Módulo 4: Gestión de Beneficiarios, Atención en Fila y Privacidad

#### HU-12: Registro único centralizado de beneficiarios
* **Código:** HU-12
* **Requerimiento Asociado:** RF-01
* **Caso de Uso:** CU-09

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario o Coordinadora** | registrar y consultar beneficiarios sobre una base de datos unificada | eliminar la discrepancia y el doble trabajo de anotar en cuadernos de cocina y hojas de reja. |

**Criterios de Aceptación:**
1. Al ingresar un número de documento o nombre, el sistema busca coincidencias en tiempo real.
2. Si el beneficiario ya está registrado, el sistema bloquea una segunda inserción y presenta la ficha consolidada.
3. El registro queda accesible inmediatamente para el control de acceso y el punto de servido.

---

#### HU-13: Captura de datos por niveles de sensibilidad
* **Código:** HU-13
* **Requerimiento Asociado:** RF-02
* **Caso de Uso:** CU-09

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario o Coordinadora** | alternar entre un formulario básico y un formulario extendido al capturar datos | recopilar únicamente los datos requeridos según la naturaleza del día, protegiendo información sensible. |

**Criterios de Aceptación:**
1. El formulario ofrece una opción visible para elegir entre registro **Básico** y **Extendido**; empieza en Básico, que basta para recibir la ración.
2. En **Básico** son obligatorios los nombres, los apellidos y la fecha de nacimiento (necesaria para proteger a los menores de edad, RF-21); el barrio es opcional (RF-24).
3. En **Extendido** se habilitan además el tipo de documento (CC, TI, RC o PPT) y su número, el teléfono y la clasificación socioeconómica (RUI o Sisbén IV, con su grupo de A1 a D21). Todos son opcionales: no tener documento no impide recibir la ración (RNF-15). Si se escribe el tipo o el número de documento, el otro se vuelve obligatorio.
4. En **Básico** no se guardan los campos del nivel extendido (minimización de datos, Ley 1581).
5. El sistema no guarda el registro si falta un campo obligatorio del nivel seleccionado.

---

#### HU-26: Emisión de turnos de atención secuenciales
* **Código:** HU-26
* **Requerimiento Asociado:** RF-03
* **Caso de Uso:** CU-10

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario en acceso ("la reja")** | emitir un tiquete con número consecutivo diario para el beneficiario verificado | organizar la fila de ingreso con transparencia y equidad. |

**Criterios de Aceptación:**
1. Solo se genera turno para usuarios verificados en el padrón central.
2. El sistema incrementa el consecutivo diario automáticamente partiendo desde el número 1 en cada nueva jornada.
3. El turno se registra con fecha, hora exacta y estado inicial "En Espera".

---

#### HU-27: Prevención de duplicidad de turnos diarios
* **Código:** HU-27
* **Requerimiento Asociado:** RF-03
* **Caso de Uso:** CU-10

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario en acceso** | que el sistema me alerte si la persona ya solicitó un turno en la fecha actual | impedir que una persona obtenga raciones múltiples indebidas en desmedro de la comunidad. |

**Criterios de Aceptación:**
1. Si se intenta generar un segundo turno para el mismo beneficiario en el mismo día, el sistema bloquea la acción.
2. La interfaz muestra un aviso con el número de turno asignado previamente y habilita únicamente su reimpresión si hubo pérdida física justificada.

---

#### HU-28: Registro de consentimiento informado inicial
* **Código:** HU-28
* **Requerimiento Asociado:** RF-19
* **Caso de Uso:** CU-13

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario o Coordinadora** | asentar la casilla de consentimiento informado al crear la ficha de un beneficiario | cumplir con los principios de la Ley 1581 de 2012 de Habeas Data antes de capturar datos personales. |

**Criterios de Aceptación:**
1. La interfaz muestra la cláusula de tratamiento de datos personales para lectura al ciudadano.
2. El registro no se completa sin la aceptación explícita del consentimiento informado.

---

#### HU-29: Registro opcional de procedencia barrial
* **Código:** HU-29
* **Requerimiento Asociado:** RF-24
* **Caso de Uso:** CU-09

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario en acceso** | registrar el barrio de procedencia de forma opcional | apoyar las estadísticas de cobertura territorial sin que este dato sea un requisito excluyente para recibir comida. |

**Criterios de Aceptación:**
1. El campo "Barrio" no tiene marcado el atributo de obligatoriedad en el formulario de registro.
2. El sistema permite completar el registro de la persona y emitir su ración aun si el campo permanece vacío.

---

### Módulo 5: Operación en Salón y Voluntariado

#### HU-14: Publicación de convocatorias y disponibilidad
* **Código:** HU-14
* **Requerimiento Asociado:** RF-13
* **Caso de Uso:** CU-12

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora** | publicar convocatorias de jornadas y consultar la disponibilidad horaria declarada por los voluntarios | planear con anticipación el personal necesario para la preparación y el servido. |

**Criterios de Aceptación:**
1. La Coordinadora publica la fecha y la cantidad de colaboradores requeridos por horario.
2. Los voluntarios registrados pueden postularse y marcar sus rangos horarios disponibles.

---

#### HU-15: Confirmación de turno por el voluntario
* **Código:** HU-15
* **Requerimiento Asociado:** RF-13
* **Caso de Uso:** CU-12

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario** | confirmar mi disponibilidad para un turno publicado de acuerdo con mi agenda | poder participar en las actividades del comedor. |

**Criterios de Aceptación:**
1. Dado que existe una convocatoria publicada con cupos disponibles, cuando el Voluntario confirma su turno, entonces el sistema registra su disponibilidad para esa fecha.
2. Dado que el cupo del turno ya está lleno, cuando un voluntario intenta confirmar, entonces el sistema impide el registro y le notifica que no hay cupo.
3. Dado que un voluntario nuevo sin inducción previa quiere confirmar turno, cuando realiza la acción, entonces puede completarla en máximo 4 pantallas y 90 segundos.

---

#### HU-16: Asignación operativa de tareas por turno
* **Código:** HU-16
* **Requerimiento Asociado:** RF-14
* **Caso de Uso:** CU-12

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora** | asignar puestos de trabajo específicos a cada voluntario en el turno operativo | ordenar el salón comunal y evitar cuellos de botella en la reja, la cocina o el lavado. |

**Criterios de Aceptación:**
1. El sistema permite asociar a cada voluntario activo una labor predefinida: "Puerta/Acceso", "Lavado/Menaje", "Servido/Comedor" o "Cocina".
2. El voluntario visualiza su tarea asignada al abrir la aplicación durante el día correspondiente.

---

#### HU-17: Guía y lista de inducción para voluntarios nuevos
* **Código:** HU-17
* **Requerimiento Asociado:** RF-15
* **Caso de Uso:** CU-12

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario nuevo** | consultar una guía/checklist interactiva sobre normas higiénicas y tareas básicas | familiarizarme rápidamente con la operación sin requerir inducción presencial a gritos durante la jornada. |

**Criterios de Aceptación:**
1. La app incluye una sección accesible de consulta rápida con los puntos clave: higiene personal (gorro, delantal, lavado de manos), manejo de filas y pautas de buen trato.
2. El voluntario puede marcar los ítems de inducción leídos antes de iniciar su primera guardia.

---

### Módulo 6: Transparencia y Excepciones

#### HU-18: Generación de acta de descarte
* **Código:** HU-18
* **Requerimiento Asociado:** RF-06
* **Caso de Uso:** CU-06

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario** | generar un acta de descarte buscando y vinculando una donación específica, adjuntando evidencia visual, y enviándola a la Coordinadora para que la autorice | asegurar la transparencia sobre los alimentos e insumos que se dan de baja y mantener un registro auditable. |

**Criterios de Aceptación:**
1. El sistema permite consultar el historial de donaciones mediante un buscador integrado (por ID o nombre del insumo).
2. El formulario valida que la evidencia visual (archivos JPG, PNG) se adjunte exitosamente antes de permitir el envío.
3. Una vez enviada, el acta pasa a estado "Pendiente" y notifica a la Coordinadora para su autorización.

---

#### HU-19: Registro de excepciones de entrega
* **Código:** HU-19
* **Requerimiento Asociado:** RF-07
* **Caso de Uso:** CU-11

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora o Voluntario** | registrar entregas extraordinarias (segundas raciones o mercados de apoyo) indicando justificación y autorizador | atender casos de vulnerabilidad crítica manteniendo la justificación documentada. |

**Criterios de Aceptación:**
1. El sistema exige de forma obligatoria el llenado del campo de texto descriptivo "Justificación".
2. Debe seleccionarse en una lista cerrada al usuario con rol de Coordinadora que autorizó la ración excepcional.
3. No se puede guardar la transacción si alguno de estos dos datos se encuentra ausente.

---

### Módulo 7: Reportes, Rendición de Cuentas y Exportación Normativa

#### HU-20: Generación de reporte de gestión para la JAC
* **Código:** HU-20
* **Requerimiento Asociado:** RF-16
* **Caso de Uso:** CU-15

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora o Presidente JAC** | generar reportes de gestión que incluyan cifras estadísticas y fotografías panorámicas sin rostros | presentar los avances a la Junta Comunal demostrando el alcance social sin vulnerar la privacidad de los vecinos. |

**Criterios de Aceptación:**
1. El sistema impide mostrar fotos con rostros identificables estructuralmente.
2. Los consolidados de asistencia y distribución por sector barrial se presentan de manera agregada sin exponer nombres ni documentos personales.

---

#### HU-21: Generación de reporte de trazabilidad para donantes
* **Código:** HU-21
* **Requerimiento Asociado:** RF-17
* **Caso de Uso:** CU-15

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora, Presidente JAC o Donante** | consultar reportes de trazabilidad de insumos (recibido / usado / descartado) a nivel numérico consolidado | conocer el aprovechamiento de las donaciones sin vincular ningún producto a beneficiarios particulares. |

**Criterios de Aceptación:**
1. El balance muestra entradas, consumo en cocina y salidas por merma agrupadas numéricamente por periodo.
2. La Coordinadora y el Presidente JAC ven el balance total; el Donante ve solo el de sus propias donaciones, según el usuario que inició sesión.
3. El reporte no asocia el descarte con una persona, no muestra la marca de un donante a otros roles ni vincula qué beneficiario consumió qué lote.

---

#### HU-22: Exportación de padrón para la Alcaldía bajo consentimiento
* **Código:** HU-22
* **Requerimiento Asociado:** RF-18
* **Caso de Uso:** CU-15

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Presidente JAC** | exportar la base de datos de beneficiarios a una hoja de cálculo estándar (.xlsx) con los campos requeridos por la Secretaría de Desarrollo Social | cumplir con los compromisos institucionales de la Alcaldía de Pereira respetando el consentimiento informado. |

**Criterios de Aceptación:**
1. El archivo generado cumple el estándar internacional OOXML (.xlsx) y se abre sin distorsión en Microsoft Excel 2013+ o LibreOffice Calc.
2. El sistema filtra e incluye en el archivo únicamente a las personas que marcaron "Sí" en la autorización de reporte a entes públicos.
3. Se genera un registro de auditoría inmutable indicando la fecha, la cantidad de registros descargados y el usuario que realizó la exportación.

---

### Módulo 8: Retención de Datos, Imagen y Protección de Menores

#### HU-23: Configuración de política de retención y purga de datos
* **Código:** HU-23
* **Requerimiento Asociado:** RF-22
* **Caso de Uso:** CU-14

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Coordinadora** | parametrizar tiempos de vida (TTL) y reglas de borrado automático de registros antiguos | depurar datos obsoletos y mantener el principio de minimización de almacenamiento. |

**Criterios de Aceptación:**
1. La Coordinadora cuenta con una sección administrativa para indicar el periodo de retención de registros de asistencia y mermas (ej. meses o años).
2. Dado que se actualiza el esquema de retención, cuando la modificación queda consolidada, entonces se generará una entrada en la bitácora de seguimiento detallando operador, marca temporal y valores parametrizados.
3. El motor del sistema ejecuta la anonimización o purga de los registros que hayan superado el tiempo de retención configurado.

---

#### HU-24: Gestión del consentimiento de imagen (opt-in)
* **Código:** HU-24
* **Requerimiento Asociado:** RF-20
* **Caso de Uso:** CU-13

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario o Coordinadora** | gestionar el permiso de uso de imagen bajo modalidad opt-in estricta | garantizar que no se capturen ni divulguen fotografías con rostros identificables sin autorización previa. |

**Criterios de Aceptación:**
1. La casilla de uso de imagen permanece desmarcada por defecto (opt-in).
2. Si la persona no otorga autorización, el sistema bloquea toda función de adjuntar imagen asociada a su ficha.

---

#### HU-25: Protección reforzada y bloqueo de imagen de menores de edad
* **Código:** HU-25
* **Requerimiento Asociado:** RF-21
* **Caso de Uso:** CU-13

| Como... (Actor) | Quiero... (Acción) | Para... (Valor) |
| :--- | :--- | :--- |
| **Voluntario o Coordinadora** | que el sistema clasifique automáticamente a menores de edad y bloquee la captura de su rostro | resguardar la intimidad y seguridad de los niños y cumplir con los estándares legales de infancia. |

**Criterios de Aceptación:**
1. Al marcar a un beneficiario como menor de edad (o indicar edad menor a 18 años), se activa una etiqueta de protección de menores en la ficha.
2. Toda captura fotográfica o publicación queda bloqueada de fábrica por el software.
3. El módulo de imagen solo se habilita si se documenta nombre y cédula del tutor legal y su firma de autorización explícita.
