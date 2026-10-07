CREATE TABLE public.miembros_equipo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  correo text NOT NULL,
  rol text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.miembros_equipo TO anon, authenticated;
GRANT ALL ON public.miembros_equipo TO service_role;
ALTER TABLE public.miembros_equipo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public access miembros" ON public.miembros_equipo FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.historias_usuario ADD COLUMN responsable_id uuid REFERENCES public.miembros_equipo(id) ON DELETE SET NULL;