# Mejora visual del Dashboard de BA Flow

## Alcance
- Modificar únicamente el Dashboard.
- Mantener intactos el modelo de datos, Lovable Cloud, el CRUD y las demás pantallas.
- Calcular todo exclusivamente desde los proyectos e historias existentes.

## Cambios
1. Reforzar la separación entre el encabezado y el contenido sin cambiar sus textos.
2. Convertir los cinco indicadores actuales en una fila compacta y adaptable, con iconos y alturas consistentes.
3. Añadir “Resumen del backlog” en dos columnas:
   - Historias por estado con barras horizontales para los seis estados actuales.
   - Historias por prioridad con barras horizontales para las cuatro prioridades actuales.
4. Añadir “Actividad del proyecto” en dos columnas:
   - Proyectos recientes con nombre, resumen, estado y fecha objetivo.
   - Historias recientes con código, título, proyecto, prioridad y estado.
5. Mantener estados de carga, error y vacío, además de los enlaces actuales a detalles.

## Detalles técnicos
- Reutilizar las consultas actuales de proyectos e historias; no añadir librerías ni llamadas nuevas.
- Ordenar la actividad reciente por `created_at` y resolver el nombre del proyecto desde los datos ya cargados.
- Construir las barras con CSS y tokens visuales existentes.
- Completar los metadatos sociales requeridos del Dashboard sin alterar su contenido.
- Verificar en escritorio y móvil las métricas, las barras, los estados vacíos y la navegación a ambos detalles.
