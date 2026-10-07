import { ESTADOS_HISTORIA, PRIORIDADES, type Criterio, type Historia } from "@/lib/baflow";

// Color de cada estado del backlog (clases de Tailwind), compartido por barras y leyendas.
export const TONO_ESTADO: Record<(typeof ESTADOS_HISTORIA)[number], string> = {
  Borrador: "bg-muted-foreground/60",
  "En análisis": "bg-info",
  "Lista para desarrollo": "bg-accent-strong",
  "En desarrollo": "bg-warning",
  Validación: "bg-warning/60",
  Finalizada: "bg-success",
};

export type Alerta = { historia: Historia; motivo: string };

const EN_CURSO = ["En análisis", "Lista para desarrollo", "En desarrollo", "Validación"];
const SIN_AVANZAR = ["Borrador", "En análisis"];

// Métricas de un proyecto calculadas a partir de sus historias y criterios (sin tocar la base).
export function resumenProyecto(historias: Historia[], criterios: Criterio[]) {
  const porEstado = Object.fromEntries(
    ESTADOS_HISTORIA.map((e) => [e, historias.filter((h) => h.estado === e).length]),
  ) as Record<(typeof ESTADOS_HISTORIA)[number], number>;
  const finalizadas = porEstado["Finalizada"];
  const criteriosPorHistoria = new Map<string, Criterio[]>();
  for (const c of criterios) {
    criteriosPorHistoria.set(c.historia_usuario_id, [
      ...(criteriosPorHistoria.get(c.historia_usuario_id) ?? []),
      c,
    ]);
  }

  const alertas: Alerta[] = [];
  for (const h of historias) {
    if (h.estado === "Finalizada") continue;
    if (!criteriosPorHistoria.get(h.id)?.length) {
      alertas.push({ historia: h, motivo: "Sin criterios de aceptación" });
    } else if (!h.responsable_id) {
      alertas.push({ historia: h, motivo: "Sin responsable asignado" });
    } else if (["Alta", "Crítica"].includes(h.prioridad) && SIN_AVANZAR.includes(h.estado)) {
      alertas.push({ historia: h, motivo: `Prioridad ${h.prioridad.toLowerCase()} sin avanzar` });
    }
  }

  return {
    total: historias.length,
    porEstado,
    porPrioridad: Object.fromEntries(
      PRIORIDADES.map((p) => [p, historias.filter((h) => h.prioridad === p).length]),
    ) as Record<string, number>,
    enCurso: historias.filter((h) => EN_CURSO.includes(h.estado)).length,
    finalizadas,
    avance: historias.length ? Math.round((finalizadas / historias.length) * 100) : 0,
    criteriosTotal: criterios.length,
    criteriosCumplidos: criterios.filter((c) => c.estado === "Cumplido").length,
    criteriosPorHistoria,
    alertas,
  };
}

export function diasRestantes(fecha: string | null) {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(`${fecha.slice(0, 10)}T00:00:00`);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);
}
