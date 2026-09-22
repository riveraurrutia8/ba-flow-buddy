CREATE TABLE public.proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  estado text NOT NULL DEFAULT 'Planificación' CHECK (estado IN ('Planificación','En ejecución','Finalizado')),
  fecha_inicio date,
  fecha_objetivo date,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proyectos TO anon, authenticated;
GRANT ALL ON public.proyectos TO service_role;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public access proyectos" ON public.proyectos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.historias_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  codigo text,
  titulo text NOT NULL,
  rol text,
  necesidad text,
  beneficio text,
  prioridad text NOT NULL DEFAULT 'Media' CHECK (prioridad IN ('Baja','Media','Alta','Crítica')),
  estado text NOT NULL DEFAULT 'Borrador' CHECK (estado IN ('Borrador','En análisis','Lista para desarrollo','En desarrollo','Validación','Finalizada')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.historias_usuario TO anon, authenticated;
GRANT ALL ON public.historias_usuario TO service_role;
ALTER TABLE public.historias_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public access historias" ON public.historias_usuario FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.criterios_aceptacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  historia_usuario_id uuid NOT NULL REFERENCES public.historias_usuario(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  estado text NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Cumplido')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.criterios_aceptacion TO anon, authenticated;
GRANT ALL ON public.criterios_aceptacion TO service_role;
ALTER TABLE public.criterios_aceptacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public access criterios" ON public.criterios_aceptacion FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_historias_proyecto ON public.historias_usuario(proyecto_id);
CREATE INDEX idx_criterios_historia ON public.criterios_aceptacion(historia_usuario_id);

INSERT INTO public.proyectos (id, nombre, descripcion, estado, fecha_inicio, fecha_objetivo) VALUES
 ('11111111-1111-1111-1111-111111111111', 'ERP Gestión de Inventario', 'Sistema para controlar existencias, movimientos y reposición de inventario en bodegas.', 'En ejecución', '2026-01-15', '2026-06-30');

INSERT INTO public.historias_usuario (id, proyecto_id, codigo, titulo, rol, necesidad, beneficio, prioridad, estado) VALUES
 ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'HU-001', 'Consulta de existencias por producto', 'encargado de bodega', 'consultar las existencias disponibles de un producto', 'saber si es necesario reponer stock a tiempo', 'Alta', 'En análisis');

INSERT INTO public.criterios_aceptacion (historia_usuario_id, descripcion, estado) VALUES
 ('22222222-2222-2222-2222-222222222222', 'El sistema permite buscar un producto por código o nombre y muestra la cantidad disponible.', 'Cumplido'),
 ('22222222-2222-2222-2222-222222222222', 'Si el stock está por debajo del mínimo definido, se muestra una alerta visual.', 'Pendiente');