# SIG-CCPT — Backend

## Sistema de Información y Gestión para el Comedor Comunitario Pan para Todos

## 1. Descripción del proyecto

El **Sistema de Información y Gestión para el Comedor Comunitario Pan para Todos (SIG-CCPT)** es un proyecto de software orientado a digitalizar y centralizar los procesos operativos del comedor comunitario Pan para Todos, ubicado en el barrio El Jardín, Pereira, Colombia.

Actualmente, la gestión de este tipo de procesos puede depender de registros manuales en papel y controles verbales, lo que dificulta la organización de la información, el seguimiento de los alimentos y la transparencia en las operaciones.

Por esta razón, SIG-CCPT busca proporcionar una solución tecnológica que permita administrar de manera organizada, segura y trazable la información relacionada con los beneficiarios, los turnos de atención, las donaciones, el inventario y el voluntariado.

Este repositorio corresponde al **backend del sistema**, encargado de procesar las solicitudes, aplicar las reglas del negocio, gestionar la información y proporcionar los servicios que consumen los diferentes portales del frontend.

## 2. Propósito del proyecto

El propósito principal de SIG-CCPT es mejorar la gestión administrativa y operativa del comedor comunitario mediante un sistema centralizado que reduzca los errores de registro, evite la duplicación de información y facilite el seguimiento de los recursos disponibles.

El proyecto busca responder a cuatro necesidades principales:

- **Control de inventario:** mejorar el seguimiento de las donaciones, los lotes de insumos, las fechas de vencimiento y los descartes de alimentos.
- **Protección de la información:** gestionar los datos personales y los consentimientos de los beneficiarios, prestando especial atención a los menores de edad y a las personas en condición de vulnerabilidad.
- **Organización del voluntariado:** facilitar la publicación de convocatorias, el registro de disponibilidad y la asignación de tareas.
- **Transparencia y trazabilidad:** registrar las operaciones importantes para facilitar la revisión de la gestión por parte de la Junta de Acción Comunal (JAC) y la coordinación del comedor.

## 3. ¿Qué hace el backend?

El backend funciona como la capa central del servidor. Expone una API REST que permite la comunicación entre el frontend y la base de datos, procesa las solicitudes y garantiza que se cumplan las reglas de negocio definidas para el sistema.

Sus principales responsabilidades son:

### 3.1. Gestión de usuarios y seguridad

- Autenticación de usuarios.
- Control de acceso basado en roles (RBAC).
- Restricción de operaciones según los permisos de cada perfil.
- Registro de acciones críticas para mantener la trazabilidad.

### 3.2. Gestión de beneficiarios

- Registro centralizado de beneficiarios.
- Validación de información para reducir registros duplicados.
- Aplicación de reglas de integridad en la base de datos.
- Conservación del historial de los registros mediante eliminación lógica, según corresponda.

### 3.3. Gestión de turnos de atención

- Generación de turnos consecutivos diarios.
- Control de turnos por beneficiario y fecha.
- Prevención de duplicaciones que puedan generar entregas repetidas de raciones el mismo día.
- Registro de excepciones relacionadas con la atención.

### 3.4. Gestión de consentimientos

- Registro de autorizaciones para el tratamiento de datos personales.
- Gestión del consentimiento para el uso de imágenes.
- Aplicación de reglas especiales para los casos que involucran menores de edad.

### 3.5. Gestión de donaciones e inventario

- Registro de donaciones recibidas.
- Control de lotes de insumos y sus fechas de vencimiento.
- Seguimiento de las existencias disponibles.
- Registro de descartes y mermas.
- Aplicación de la regla FEFO (*First Expired, First Out*), que prioriza la salida de los productos que vencen primero.
- Registro de incidentes relacionados con la cadena de frío.

### 3.6. Gestión del voluntariado

- Publicación de convocatorias de voluntariado.
- Registro de disponibilidad de los voluntarios.
- Asignación de tareas según las jornadas de servicio.

### 3.7. Auditoría y reportes

- Registro de acciones críticas realizadas por los usuarios.
- Seguimiento de quién realizó una operación y cuándo.
- Generación de reportes agregados.
- Exportación de información autorizada a archivos Excel (.xlsx).
- Protección de la privacidad mediante la reducción de la exposición de datos personales en los reportes.

### 3.8. Protección de imágenes

El sistema contempla un microservicio desarrollado en Python que utiliza OpenCV para detectar y difuminar rostros en fotografías de evidencia cuando no existe un consentimiento válido, de acuerdo con las reglas establecidas para el proyecto.

## 4. Alcance del proyecto

### 4.1. Funcionalidades incluidas

El alcance definido para el backend comprende:

- API REST central.
- Autenticación y control de acceso por roles.
- Registro y gestión de beneficiarios.
- Validación para prevenir duplicidad de registros.
- Gestión de turnos y consentimientos.
- Registro y seguimiento de donaciones.
- Administración de lotes de insumos e inventario.
- Control de vencimientos mediante la regla FEFO.
- Gestión de descartes, mermas, excepciones e incidentes.
- Publicación de convocatorias y asignación de tareas de voluntariado.
- Auditoría de operaciones críticas.
- Generación de reportes agregados y exportaciones a Excel.
- Microservicio de difuminado de rostros según las condiciones de consentimiento definidas.
- Aplicación de restricciones de integridad en la base de datos.

### 4.2. Funcionalidades fuera del alcance

Para mantener un alcance definido y viable, el proyecto no contempla:

- Desarrollo de las interfaces visuales del frontend dentro de este repositorio.
- Trámites jurídicos externos, como la obtención de personería jurídica o conceptos sanitarios del INVIMA.
- Facturación, venta de raciones o recaudo de dinero.
- Integración directa mediante API con los sistemas ERP de las empresas donantes.
- Funcionamiento sin conexión mediante una arquitectura *offline-first*.
- Restricciones de acceso al comedor basadas en la procedencia barrial.

### 4.3. Modalidad de operación

El sistema está diseñado para funcionar **100 % en línea**, mediante solicitudes en tiempo real a la API central. Por lo tanto, la comunicación con el backend requiere conectividad.

## 5. Arquitectura y tecnologías utilizadas

El backend utiliza una arquitectura modular para organizar las responsabilidades del sistema y facilitar su mantenimiento y evolución.

| Componente | Tecnología o enfoque |
|---|---|
| Backend principal | NestJS |
| Comunicación | API REST |
| Base de datos | MySQL con motor InnoDB |
| Acceso a datos | TypeORM |
| Organización arquitectónica | Arquitectura hexagonal y módulos independientes |
| Microservicio de imágenes | Python y OpenCV |
| Integridad de datos | Restricciones y validaciones a nivel de base de datos |
| Eliminación de registros | Eliminación lógica (*soft delete*) en las entidades definidas |
| Exportación de reportes | Excel (.xlsx) |

### 5.1. Integridad de los datos

El sistema contempla restricciones de integridad a nivel de base de datos para reforzar las reglas del negocio y evitar depender únicamente de las validaciones de la interfaz.

Entre los ejemplos definidos se encuentran:

- Restricciones de unicidad para identificadores de beneficiarios y mecanismos de deduplicación.
- Control para evitar más de un turno por beneficiario en una misma fecha.
- Uso de eliminación lógica para conservar el historial de determinados registros.

### 5.2. Organización modular

El código se organiza en módulos independientes que agrupan las funcionalidades relacionadas, facilitando la separación de responsabilidades y el mantenimiento del sistema.

## 6. Módulos y entidades principales

El modelo de datos contempla 13 entidades organizadas en cuatro dominios funcionales:

| Dominio | Entidades | Responsabilidad |
|---|---|---|
| Seguridad y RBAC | Usuario, Rol, AuditoriaLog | Gestión de cuentas, permisos y trazabilidad de operaciones. |
| Atención y padrón | Beneficiario, Consentimiento, TurnoAtencion, ExcepcionEntrega | Registro de beneficiarios, consentimientos y control de turnos. |
| Inventario y donaciones | Donacion, LoteInsumo, DescarteMerma, IncidenteFrio | Gestión de aportes, lotes, existencias, descartes e incidentes. |
| Voluntariado comunitario | ConvocatoriaVoluntariado, AsignacionTarea | Organización de jornadas y asignación de tareas. |

El modelo relacional está diseñado siguiendo los principios de normalización hasta la tercera forma normal (1FN, 2FN y 3FN), con el objetivo de reducir la redundancia y mantener la consistencia de la información.

## 7. Seguridad, privacidad y trazabilidad

La protección de la información es un aspecto importante del proyecto. Para ello, el backend contempla:

- Control de acceso según los roles y permisos asignados.
- Validación de las operaciones solicitadas.
- Restricciones de integridad en la base de datos.
- Registro de acciones críticas para facilitar auditorías.
- Conservación del historial mediante eliminación lógica en los registros definidos.
- Gestión de consentimientos para el tratamiento de datos personales y el uso de imágenes.
- Protección especial de la información de menores de edad.
- Generación de reportes agregados para reducir la exposición de datos individuales.

El diseño del proyecto toma como referencia la Ley 1581 de 2012 y el Decreto 1377 de 2013, relacionados con la protección de datos personales en Colombia.

## 8. Ejemplo general de funcionamiento

Para comprender el funcionamiento del sistema, se pueden considerar dos situaciones:

**Caso 1. Atención de un beneficiario**

Cuando una persona llega al comedor, un usuario autorizado puede consultar o registrar sus datos. El backend aplica las reglas de validación, verifica las condiciones relacionadas con los turnos y registra el turno correspondiente si no existe uno para ese beneficiario en la fecha actual. Las operaciones críticas pueden quedar registradas para su posterior revisión.

**Caso 2. Registro de una donación**

Cuando el comedor recibe una donación, la información se registra en el sistema y se organiza en lotes de insumos con sus respectivas fechas de vencimiento. De esta manera, se facilita el control de existencias y la aplicación de la regla FEFO para priorizar los productos próximos a vencer.

Estos procesos permiten centralizar la información y mejorar el seguimiento de las actividades del comedor comunitario.

## 9. Equipo encargado del backend

El desarrollo del backend está a cargo de los siguientes integrantes:

- **David Mauricio Zambrano Guerrero**
- **Jenkner Johan Arteaga Delgado**
- **José Leonel Enríquez Zambrano**

## 10. Conclusión

SIG-CCPT busca contribuir a una gestión más organizada, segura y transparente del comedor comunitario Pan para Todos mediante la centralización de sus procesos operativos.

El backend constituye la base funcional del sistema, ya que administra la información, aplica las reglas del negocio, controla los permisos y proporciona los servicios necesarios para la comunicación con el frontend.

La solución está orientada a mejorar la trazabilidad de las donaciones, el control del inventario, la atención de los beneficiarios y la organización del voluntariado, manteniendo como prioridades la integridad y la protección de los datos.

---

**SIG-CCPT — Sistema de Información y Gestión para el Comedor Comunitario Pan para Todos**

*Repositorio correspondiente al desarrollo del backend del proyecto.*


## RF-10 · Cadena de frío

El contrato Swagger está disponible en `/api/docs`. Ambos endpoints requieren
un JWT de un usuario activo.

| Método y ruta | Roles | Respuesta |
|---|---|---|
| `GET /equipos-refrigeracion` | Voluntario, coordinadora | `200` con el catálogo, incluido el estado de cada equipo |
| `POST /incidentes-cadena-frio` | Voluntario | `201` con el incidente, el ID del voluntario autenticado y la fecha de registro |

El reporte recibe `equipoId`, `temperaturaObservada` (°C),
`minutosTranscurridos` (entero no negativo), `insumosAfectados` (lista de
textos) y `accionCorrectiva` (texto obligatorio). Un equipo inexistente o
inactivo produce `404`. El reporte se guarda mediante inserción y carece de
rutas de modificación. Cada consulta exitosa del catálogo deja un registro
de auditoría con el ID del usuario y la fecha.

La migración del módulo se aplica al arrancar. El catálogo se provisiona con
los equipos reales de cada instalación. Ejemplo de alta en MySQL:

```sql
INSERT INTO equipos_refrigeracion (id, nombre, tipo)
VALUES (UUID(), 'Nevera de cocina', 'NEVERA');
```

Los tipos admitidos son `NEVERA` y `CONGELADOR`.


## RF-19 · Consentimiento informado

El alta con `POST /beneficiarios` conserva `autorizaTratamientoDatos: true`
y requiere un objeto `consentimiento`. La ficha y la evidencia de aceptación
se guardan en una sola transacción. La evidencia no se modifica vía PATCH.

`POST /beneficiarios/:id/consentimiento` registra la evidencia para una ficha
activa existente. Ambos flujos requieren el JWT de un voluntario o una coordinadora.
El objeto de consentimiento (cuerpo completo para el segundo endpoint) es:

```json
{
  "aceptado": true,
  "versionTexto": 1,
  "finalidad": "ATENCION_ALIMENTARIA",
  "metodo": "VERBAL_CON_TESTIGO"
}
```

Los métodos admitidos son `VERBAL_CON_TESTIGO`, `HUELLA` y `FIRMA_SIMPLE`.
Se guarda el método declarado, la versión, la finalidad, la fecha y el ID del
operador autenticado. La API registra los datos de la aceptación sin recibir
imágenes, huellas biométricas ni archivos de firma. El endpoint devuelve
`201` al registrar una versión, `200` con la evidencia original al repetir
la misma versión y `404` cuando la ficha no existe o está desactivada.

El contrato está en `/api/docs`. La migración se aplica al iniciar el backend.
La suite HTTP se ejecuta con `npm run test:e2e -- consentimientos.e2e-spec.ts`.
La suite `consentimientos.mysql.e2e-spec.ts` se habilita con
`RF19_MYSQL_E2E=1` y usa una base local temporal.


### Contrato de ficha y finalidades

El alta admite también `nivel` como alias de `nivelRegistro`, y
`clasificacion: { sistema, grupo }` como alternativa a
`clasificacionSocioeconomica`. Para Sisbén (`SISBEN` o `SISBEN_IV`) se
guarda el grupo normalizado. Para `RUI` se guarda `RUI`. Si se envían
ambos formatos, deben coincidir.

`metodo` es obligatorio y se registra como texto, sin adjuntos. La ruta de
consentimiento admite `ATENCION_ALIMENTARIA` y `USO_IMAGEN`. El alta requiere
`ATENCION_ALIMENTARIA`; el consentimiento de imagen se registra por separado.

Las respuestas que incluyen una ficha devuelven `consentimiento` con la
última versión registrada de atención alimentaria, o `null` si está
pendiente. Cada evidencia incluye `registradoPor: { id, nombreCompleto }`
además de `registradoPorId`. La coordinadora recibe documento, teléfono y
clasificación. Para el voluntario esos campos se omiten en todas las
respuestas de ficha.


## RF-20 · Consentimiento de uso de imagen

La ficha devuelve `consentimientoImagen` con la autorización efectiva o
`null`. El frontend habilita captura o publicación de rostros identificables
solo cuando obtiene una autorización vigente. Si la consulta falla o falta el
permiso, mantiene el bloqueo.

| Operación | Cuerpo o parámetro | Respuesta |
|---|---|---|
| `POST /beneficiarios/:id/consentimiento` | `{ "versionPolitica": 1, "finalidad": "USO_IMAGEN" }` | `201` con la evidencia o `200` con la autorización que ya está vigente. También admite el formato de RF-19 con `aceptado: true`, `versionTexto`, `finalidad` y `metodo`. |
| `POST /beneficiarios/:id/consentimiento/revocacion` | `{ "finalidad": "USO_IMAGEN" }` | `200` con la evidencia revocada o `404` si no hay autorización vigente. |
| `GET /beneficiarios/:id/consentimientos` | `?finalidad=USO_IMAGEN` | `200` con la lista del registro más reciente al más antiguo. |
| `PUT /beneficiarios/:id/consentimiento-imagen` | `{ "autorizado": true, "versionPolitica": 1 }` o `{ "autorizado": false }` | `200` con la misma evidencia. Comparte las reglas de autorización y revocación del POST. |

Todas las rutas requieren JWT de voluntario o coordinadora. La evidencia de
imagen incluye `versionPolitica`, `createdAt`, `registradoPor`,
`revocadoPor`, `revocadoEn` y `vigente`, además de los campos de RF-19.
El formato abreviado y el PUT registran el método `VERBAL_CON_TESTIGO`.
El servidor asigna operador y fechas. Las decisiones se guardan en el registro
de RF-19 por finalidad, con una sola autorización vigente de imagen por ficha.
Una nueva autorización después de revocar conserva el registro anterior.

Los opt-in para menores siguen las reglas de RF-21 descritas abajo. Las filas históricas de imagen
creadas antes de RF-20 aparecen en el historial como inactivas, sin habilitar
el permiso. El contrato está en `/api/docs`.

La migración puede revertirse antes de registrar revocaciones. La reversión
se detiene si el esquema anterior perdería evidencia o no admite versiones
repetidas. La suite con MariaDB comparte el entorno temporal de RF-19 y se
habilita con `RF19_MYSQL_E2E=1`.

## RF-21 · Protección de la imagen de menores

La API calcula `esMenorEdad` usando la fecha de nacimiento y el calendario
de Colombia. La ficha incluye `autorizacionTutor` con la autorización activa
si el beneficiario es menor, o `null`. El voluntario recibe solo el ID,
estado y fecha de aprobación. La coordinadora recibe también los datos del
tutor y del personal que aprobó o revocó. El soporte firmado se guarda de
forma privada en la base y no se incluye en las respuestas.

| Operación | Contrato |
|---|---|
| `POST /beneficiarios/:id/autorizacion-tutor` | Solo Coordinadora. `multipart/form-data` con `nombreTutor`, `tipoDocumentoTutor` (`CC`, `CE`, `PPT`, `PASAPORTE`), `numeroDocumentoTutor`, `parentesco` (`MADRE`, `PADRE`, `ACUDIENTE`, `TUTOR_LEGAL`), `telefonoTutor` y archivo `soporte` (PDF, JPG o PNG, hasta 5 MiB). Responde `201`; `409` si la ficha es adulta o ya tiene una autorización activa; `413` si el soporte supera el límite. |
| `POST /beneficiarios/:id/autorizacion-tutor/revocacion` | Solo Coordinadora. JSON `{ "motivo": "Retiro solicitado" }`. Responde `200` con la evidencia revocada o `404` si no hay autorización activa. |

El alta del tutor registra la aprobación del soporte. Para habilitar
`consentimientoImagen`, la coordinadora registra después el opt-in mediante
RF-20. El servidor devuelve `403 REQUIERE_COORDINADORA` si un voluntario
intenta autorizar la imagen de un menor y `409 REQUIERE_TUTOR` si la
coordinadora lo solicita sin una autorización activa. Ambos roles pueden
retirar el consentimiento de imagen. Revocar al tutor retira de forma
atómica el permiso de imagen vinculado y conserva ambas evidencias.

Al cumplir 18 años la ficha devuelve `null` en ambos permisos del tutor
y la persona puede registrar su propia autorización de imagen. El nuevo
registro retira el anterior si aún figura activo en el historial. La
autorización de imagen es independiente de la entrega de alimentos. Según
el acuerdo de la issue #68, el backend no ofrece un endpoint de fotos de
beneficiarios.

El contrato está en `/api/docs` y los casos de integración se ejecutan con
`RF19_MYSQL_E2E=1` en la suite de consentimientos. La migración se puede
revertir antes de guardar autorizaciones de tutor; luego se detiene para
preservar la evidencia y evitar que el esquema previo interprete un permiso
del tutor como un permiso del adulto.

## RF-16 · Reporte de gestión para la JAC

`GET /reportes/gestion?periodo=2026-11` requiere JWT de `COORDINADORA`
o `PRESIDENTE_JAC`. El parámetro `periodo` es obligatorio y tiene formato
`AAAA-MM`. Una solicitud inválida responde `400`, sin sesión `401` y con
otro rol `403`. La respuesta es JSON con `Cache-Control: no-store`.

| Campo | Contenido |
|---|---|
| `periodo` | Mes consultado. |
| `turnosEmitidos`, `turnosAtendidos` | Conteos del mes. Atendidos cuenta solo el estado `ATENDIDO`. |
| `diasAtencion` | Días con al menos un turno atendido. |
| `asistenciaDiaria` | Serie con `fecha`, `turnosEmitidos` y `turnosAtendidos`, ordenada por fecha. |
| `descartesRegistrados`, `descartesPorUnidad` | Total de descartes y grupos `{ unidadMedida, cantidad }`. La suma usa solo `KG`, `G`, `L`, `ML` y `UNIDAD`. |
| `actasAutorizadas` | Conteo por fecha de autorización. |
| `fotos` | Arreglo vacío hasta contar con una fuente que verifique las panorámicas antes de publicarlas. Las referencias de las actas quedan fuera de la galería. |

Los cortes horarios de descartes y actas corresponden a Colombia. En meses
sin actividad se devuelven ceros y arreglos vacíos. Cada consulta exitosa
registra por separado el operador, el mes y la fecha de consulta. El reporte
excluye datos de beneficiarios, productos, donantes y texto libre.

El contrato está en Swagger en `/api/docs`. La prueba HTTP se ejecuta con
`npm run test:e2e -- reportes.e2e-spec.ts`. La suite MariaDB usa una base
local temporal y se habilita con `RF16_MYSQL_E2E=1`.
