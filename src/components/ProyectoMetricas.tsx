import { ESTADOS_HISTORIA } from "@/lib/baflow";
import { TONO_ESTADO } from "@/lib/metricas";
import { cn } from "@/lib/utils";

type PorEstado = Record<(typeof ESTADOS_HISTORIA)[number], number>;

// Una sola barra dividida por estado: muestra de un vistazo en qué etapa está el backlog.
export function BarraEstados({
  porEstado,
  total,
  className,
}: {
  porEstado: PorEstado;
  total: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="img"
      aria-label={ESTADOS_HISTORIA.map((e) => `${e}: ${porEstado[e]}`).join(", ")}
    >
      {total > 0 &&
        ESTADOS_HISTORIA.filter((e) => porEstado[e] > 0).map((e) => (
          <div
            key={e}
            className={TONO_ESTADO[e]}
            style={{ width: `${(porEstado[e] / total) * 100}%` }}
          />
        ))}
    </div>
  );
}

export function LeyendaEstados({ porEstado }: { porEstado: PorEstado }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {ESTADOS_HISTORIA.filter((e) => porEstado[e] > 0).map((e) => (
        <li key={e} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", TONO_ESTADO[e])} aria-hidden="true" />
          {e} <span className="font-semibold tabular-nums text-foreground">{porEstado[e]}</span>
        </li>
      ))}
    </ul>
  );
}

export function BarraAvance({ avance }: { avance: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={avance}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance del proyecto"
      >
        <div
          className="h-full rounded-full bg-success transition-[width] duration-500"
          style={{ width: `${avance}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-semibold tabular-nums text-foreground">
        {avance}%
      </span>
    </div>
  );
}
