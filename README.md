# BA Flow Hub

Quiero construir una aplicación web llamada BA Flow, orientada al trabajo de un Business Analyst.

IMPORTANTE:

Quiero mantener el alcance pequeño y funcional. No agregues funcionalidades adicionales a las solicitadas y no implementes autenticación, usuarios, notificaciones, archivos adjuntos, comentarios, integraciones externas ni otras funciones fuera de este alcance.

OBJETIVO

BA Flow permitirá gestionar proyectos de software, sus historias de usuario y los criterios de aceptación asociados.

TECNOLOGÍA

Utiliza Lovable Cloud como backend y base de datos.

Toda la información debe persistir después de recargar la página.

MODELO DE DATOS

1. Proyecto

- id

- nombre: obligatorio

- descripción

- estado: Planificación, En ejecución, Finalizado

- fecha_inicio

- fecha_objetivo

- created_at

2. Historia de Usuario

- id

- proyecto_id: relación obligatoria con Proyecto

- código

- título: obligatorio

- rol

- necesidad

- beneficio

- prioridad: Baja, Media, Alta, Crítica

- estado: Borrador, En análisis, Lista para desarrollo, En desarrollo, Validación, Finalizada

- created_at

3. Criterio de Aceptación

- id

- historia_usuario_id: relación obligatoria con Historia de Usuario

- descripción: obligatorio

- estado: Pendiente, Cumplido

- created_at

RELACIONES

- Un Proyecto puede tener muchas Historias de Usuario.

- Una Historia de Usuario pertenece a un Proyecto.

- Una Historia de Usuario puede tener muchos Criterios de Aceptación.

- Un Criterio de Aceptación pertenece a una Historia de Usuario.

FUNCIONALIDADES

Dashboard:

- Mostrar cantidad total de proyectos.

- Mostrar cantidad total de historias de usuario.

- Mostrar historias En análisis.

- Mostrar historias Lista para desarrollo.

- Mostrar historias Finalizadas.

- Mostrar los proyectos recientes.

Proyectos:

- Listar proyectos.

- Crear proyecto.

- Editar proyecto.

- Eliminar proyecto.

- Antes de eliminar, solicitar confirmación.

- Permitir entrar al detalle del proyecto.

Detalle de Proyecto:

- Mostrar información general del proyecto.

- Mostrar todas las historias de usuario asociadas.

- Permitir crear una nueva Historia de Usuario.

- Permitir editar y eliminar Historias de Usuario.

- Mostrar visualmente prioridad y estado.

Detalle de Historia de Usuario:

- Mostrar código y título.

- Mostrar la historia siguiendo visualmente esta estructura:

  "Como [rol], quiero [necesidad], para [beneficio]."

- Mostrar prioridad y estado.

- Permitir editar la historia.

- Mostrar sus criterios de aceptación.

- Crear, editar y eliminar criterios de aceptación.

- Permitir cambiar el estado de un criterio.

VALIDACIONES Y FEEDBACK

- Validar campos obligatorios.

- Mostrar mensajes de éxito cuando una operación se complete.

- Mostrar mensajes claros cuando ocurra un error.

- Mostrar estado de carga mientras se consulta información.

- Mostrar estados vacíos cuando no existan proyectos, historias o criterios.

- Solicitar confirmación antes de eliminar registros.

DISEÑO

Quiero una interfaz moderna, limpia y profesional, similar a una herramienta SaaS utilizada por equipos de producto y tecnología.

Utiliza:

- menú lateral;

- dashboard con cards;

- tablas o cards claras para los registros;

- badges para estados y prioridades;

- formularios simples;

- buena jerarquía visual;

- diseño responsive.

No quiero una interfaz excesivamente decorada.

DATOS DE PRUEBA

Crea algunos datos de ejemplo para visualizar la aplicación:

- Proyecto: ERP Gestión de Inventario

- Una Historia de Usuario relacionada con consulta de existencias.

- Al menos 2 criterios de aceptación asociados.

REQUISITO FINAL

Antes de finalizar, verifica que las operaciones Crear, Leer, Actualizar y Eliminar funcionen correctamente y que todos los datos se almacenen realmente en Lovable Cloud.

No agregues funcionalidades fuera de este alcance.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ba-flow-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fe3addfa-ddcd-4848-99bb-a4e136113bd7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
