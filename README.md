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
