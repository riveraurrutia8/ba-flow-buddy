import { supabase } from "@/integrations/supabase/client";

export const ESTADOS_PROYECTO = ["Planificación", "En ejecución", "Finalizado"] as const;
export const PRIORIDADES = ["Baja", "Media", "Alta", "Crítica"] as const;
export const ESTADOS_HISTORIA = [
  "Borrador",
  "En análisis",
  "Lista para desarrollo",
  "En desarrollo",
  "Validación",
  "Finalizada",
] as const;
export const ESTADOS_CRITERIO = ["Pendiente", "Cumplido"] as const;

export type Proyecto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fecha_inicio: string | null;
  fecha_objetivo: string | null;
  created_at: string;
};

export type Historia = {
  id: string;
  proyecto_id: string;
  codigo: string | null;
  titulo: string;
  rol: string | null;
  necesidad: string | null;
  beneficio: string | null;
  prioridad: string;
  estado: string;
  responsable_id: string | null;
  created_at: string;
};

export type Criterio = {
  id: string;
  historia_usuario_id: string;
  descripcion: string;
  estado: string;
  created_at: string;
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export const api = {
  async listProyectos() {
    return unwrap<Proyecto[]>(
      await supabase.from("proyectos").select("*").order("created_at", { ascending: false }),
    );
  },
  async getProyecto(id: string) {
    return unwrap<Proyecto>(await supabase.from("proyectos").select("*").eq("id", id).single());
  },
  async createProyecto(values: Partial<Proyecto>) {
    return unwrap<Proyecto>(
      await supabase.from("proyectos").insert(values as never).select().single(),
    );
  },
  async updateProyecto(id: string, values: Partial<Proyecto>) {
    return unwrap<Proyecto>(
      await supabase
        .from("proyectos")
        .update(values as never)
        .eq("id", id)
        .select()
        .single(),
    );
  },
  async deleteProyecto(id: string) {
    const { error } = await supabase.from("proyectos").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listHistorias(proyectoId?: string) {
    let q = supabase.from("historias_usuario").select("*").order("created_at", { ascending: true });
    if (proyectoId) q = q.eq("proyecto_id", proyectoId);
    return unwrap<Historia[]>(await q);
  },
  async getHistoria(id: string) {
    return unwrap<Historia>(
      await supabase.from("historias_usuario").select("*").eq("id", id).single(),
    );
  },
  async createHistoria(values: Partial<Historia>) {
    return unwrap<Historia>(
      await supabase
        .from("historias_usuario")
        .insert(values as never)
        .select()
        .single(),
    );
  },
  async updateHistoria(id: string, values: Partial<Historia>) {
    return unwrap<Historia>(
      await supabase
        .from("historias_usuario")
        .update(values as never)
        .eq("id", id)
        .select()
        .single(),
    );
  },
  async deleteHistoria(id: string) {
    const { error } = await supabase.from("historias_usuario").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listCriterios(historiaId: string) {
    return unwrap<Criterio[]>(
      await supabase
        .from("criterios_aceptacion")
        .select("*")
        .eq("historia_usuario_id", historiaId)
        .order("created_at", { ascending: true }),
    );
  },
  async createCriterio(values: Partial<Criterio>) {
    return unwrap<Criterio>(
      await supabase
        .from("criterios_aceptacion")
        .insert(values as never)
        .select()
        .single(),
    );
  },
  async updateCriterio(id: string, values: Partial<Criterio>) {
    return unwrap<Criterio>(
      await supabase
        .from("criterios_aceptacion")
        .update(values as never)
        .eq("id", id)
        .select()
        .single(),
    );
  },
  async deleteCriterio(id: string) {
    const { error } = await supabase.from("criterios_aceptacion").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listMiembros() {
    return unwrap<Miembro[]>(
      await supabase.from("miembros_equipo").select("*").order("nombre", { ascending: true }),
    );
  },
  async createMiembro(values: Partial<Miembro>) {
    return unwrap<Miembro>(
      await supabase.from("miembros_equipo").insert(values as never).select().single(),
    );
  },
  async updateMiembro(id: string, values: Partial<Miembro>) {
    return unwrap<Miembro>(
      await supabase.from("miembros_equipo").update(values as never).eq("id", id).select().single(),
    );
  },
  async deleteMiembro(id: string) {
    const { error } = await supabase.from("miembros_equipo").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export type Miembro = {
  id: string;
  nombre: string;
  correo: string;
  rol: string | null;
  created_at: string;
};

export function formatFecha(value: string | null) {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
