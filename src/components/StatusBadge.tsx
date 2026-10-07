import { cn } from "@/lib/utils";

const estadoProyecto: Record<string, string> = {
  Planificación: "bg-muted text-muted-foreground border-border",
  "En ejecución": "bg-info-soft text-info border-info/25",
  Finalizado: "bg-success-soft text-success border-success/25",
};

const estadoHistoria: Record<string, string> = {
  Borrador: "bg-muted text-muted-foreground border-border",
  "En análisis": "bg-info-soft text-info border-info/25",
  "Lista para desarrollo": "bg-accent-soft text-accent-strong border-accent-strong/25",
  "En desarrollo": "bg-warning-soft text-warning border-warning/25",
  Validación: "bg-warning-soft text-warning border-warning/25",
  Finalizada: "bg-success-soft text-success border-success/25",
};

const prioridades: Record<string, string> = {
  Baja: "bg-muted text-muted-foreground border-border",
  Media: "bg-info-soft text-info border-info/25",
  Alta: "bg-warning-soft text-warning border-warning/25",
  Crítica: "bg-danger-soft text-danger border-danger/25",
};

const criterio: Record<string, string> = {
  Pendiente: "bg-warning-soft text-warning border-warning/25",
  Cumplido: "bg-success-soft text-success border-success/25",
};

const riesgo: Record<string, string> = {
  Alto: "bg-danger-soft text-danger border-danger/25",
  Medio: "bg-warning-soft text-warning border-warning/25",
  Bajo: "bg-success-soft text-success border-success/25",
};

const maps = {
  proyecto: estadoProyecto,
  historia: estadoHistoria,
  prioridad: prioridades,
  criterio,
  riesgo,
};

export function StatusBadge({
  value,
  kind,
  className,
}: {
  value: string;
  kind: keyof typeof maps;
  className?: string;
}) {
  const tone = maps[kind][value] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone,
        className,
      )}
    >
      {value}
    </span>
  );
}
