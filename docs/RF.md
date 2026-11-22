# Requerimientos Funcionales

## Sistema de Información y Gestión para el Comedor Comunitario Pan para Todos (SIG-CCPT)

**RF-01**  
El sistema debe permitir un registro único centralizado de beneficiarios, evitando la doble captura actual entre Lucía (cuaderno) y Ernesto ("la reja").

**RF-02**  
El sistema debe soportar campos de datos por nivel de sensibilidad (básico: nombre/barrio; extendido: cédula/teléfono/Sisbén), capturando únicamente lo necesario según el propósito.

**RF-03**  
El sistema debe generar un número de turno o tiquete para ordenar la fila de atención.

**RF-04**  
El sistema debe permitir niveles de acceso diferenciados por rol (coordinadora, presidente JAC, voluntario, donante).

**RF-05**  
El sistema debe registrar el descarte de alimentos indicando cantidad, motivo, fecha y responsable que autorizó ("autorizado por" como campo obligatorio, no ambiguo).

**RF-06**  
El sistema debe generar un acta de descarte trazable, vinculada a la donación de origen, que registre kilos descartados, motivo, firma de autorización y **evidencia fotográfica del producto o acta de pesaje**, evitando enfocar logotipos corporativos en basura ni rostros humanos, para sustentar bajas ante auditorías de donantes y evitar descuadres como el incidente del pollo (abril 2026).

**RF-07**  
El sistema debe permitir registrar excepciones de entrega (ración extra, mercado adicional) con justificación y responsable que autorizó.

**RF-08**  
El sistema debe registrar insumos disponibles (inventario) con fecha de recepción y fecha de vencimiento declarada por el donante.

**RF-09**  
El sistema debe emitir notificaciones preventivas sobre productos cercanos a su caducidad, sirviendo de soporte técnico (sin reemplazar la decisión humana) para la gestión del descarte.

**RF-10**  
El sistema debe permitir registrar incidentes de fallo de cadena de frío (nevera/congelador).

**RF-11**  
El sistema debe permitir registrar una 'oferta de donación' (donante, ítems, cantidad estimada), permitiendo al coordinador aceptarla o rechazarla tras verificar la capacidad de inventario, generando una confirmación automática al donante. Una vez recibida la donación físicamente, se registrará el peso final (indicando si es 'estimado' o 'medido') y se **adjuntará obligatoriamente soporte fotográfico de las cajas, bultos o entrega en cocina** (con restricción estricta de no enfocar rostros ni comensales) para auditoría interna del donante corporativo.

**RF-12**  
El sistema debe generar un recibo o certificado de donación descargable para el donante.

**RF-13**  
El sistema debe permitir publicar convocatorias de turnos y registrar la disponibilidad de voluntarios.

**RF-14**  
El sistema debe permitir asignar tareas por turno (puerta, lavado, servido).

**RF-15**  
El sistema debe ofrecer una guía/checklist básica de inducción accesible para voluntarios nuevos.

**RF-16**  
El sistema debe generar reportes de gestión (listados, fotos agregadas sin rostro) para la JAC, sin exponer identidad individual.

**RF-17**  
El sistema debe generar reportes de trazabilidad de donaciones (recibido / usado / descartado) a nivel agregado por período, sin vincular producto a beneficiario individual.

**RF-18**  
El sistema debe permitir exportar el listado de beneficiarios en formato Excel con el subconjunto de campos exigido por la Alcaldía, incluyendo únicamente a quienes dieron consentimiento para dicho reporte.

**RF-19**  
El sistema debe registrar el consentimiento informado del beneficiario al capturar sus datos por primera vez (aceptación explícita).

**RF-20**  
El sistema debe gestionar el consentimiento de uso de imagen por beneficiario (opt-in/opt-out), bloqueando por defecto el uso de fotos con rostro identificable.

**RF-21**  
El sistema debe marcar a los beneficiarios menores de edad y bloquear la captura/uso de su imagen sin autorización expresa del tutor.

**RF-22**  
El sistema debe permitir definir una política de retención y borrado de datos (tiempo de vida configurable).

**RF-23** *(eliminado)*  
~~El sistema debe implementar una cola de sincronización: los reportes/registros generados sin conexión se envían automáticamente al recuperar la señal.~~ Se descartó porque la aplicación es 100% en línea (RNF-01). El número no se reutiliza.

**RF-24**  
El sistema debe permitir registrar un campo opcional de barrio/procedencia del beneficiario, sin que este sea un filtro obligatorio de acceso al servicio (punto de política abierta entre Ernesto y Lucía).

**RF-25**  
El sistema debe facilitar un módulo de gestión reservado para la Coordinadora, que habilite el alta, modificación y baja de cuentas de usuario (voluntarios, JAC, donantes), asegurando el control de ingreso solo a personal validado.
