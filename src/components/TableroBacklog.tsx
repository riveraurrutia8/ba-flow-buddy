import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ListChecks, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Iniciales } from "@/components/Iniciales";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useMoverHistoria } from "@/hooks/use-cambio-estado";
import { ESTADOS_HISTORIA, type Criterio, type Historia, type Miembro } from "@/lib/baflow";
import { TONO_ESTADO } from "@/lib/metricas";
import { cn } from "@/lib/utils";

// Tablero del backlog: una columna por estado. Las historias se mueven arrastrándolas
// o con las flechas de cada tarjeta, y el cambio dispara el mismo aviso a n8n que el formulario.
export function TableroBacklog({
  proyectoId,
  historias,
  criteriosPorHistoria,
  miembros,
  onEditar,
  onEliminar,
}: {
  proyectoId: string;
  historias: Historia[];
  criteriosPorHistoria: Map<string, Criterio[]>;
  miembros: Map<string, Miembro>;
  onEditar: (h: Historia) => void;
  onEliminar: (h: Historia) => void;
}) {
  const mover = useMoverHistoria(proyectoId);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);

  const moverA = (h: Historia, estado: string) => {
    if (h.estado !== estado) mover.mutate({ historia: h, estado });
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-3">
        {ESTADOS_HISTORIA.map((estado, i) => {
          const suyas = historias.filter((h) => h.estado === estado);
          return (
            <section
              key={estado}
              aria-label={`${estado}: ${suyas.length} historias`}
              onDragOver={(e) => {
                if (!arrastrando) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setSobre(estado);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSobre(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const h = historias.find((x) => x.id === e.dataTransfer.getData("text/plain"));
                if (h) moverA(h, estado);
                setSobre(null);
                setArrastrando(null);
              }}
              className={cn(
                "flex w-60 shrink-0 flex-col gap-2 rounded-xl border border-border bg-muted/40 p-2 transition-colors",
                sobre === estado && "border-primary bg-primary/5",
              )}
            >
              <h2 className="flex items-center gap-2 px-1.5 pt-1 text-sm font-semibold text-foreground">
                <span className={cn("size-2 rounded-full", TONO_ESTADO[estado])} />
                {estado}
                <span className="font-normal text-muted-foreground">{suyas.length}</span>
              </h2>

              {suyas.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  Arrastra una historia aquí
                </p>
              )}

              {suyas.map((h) => {
                const criterios = criteriosPorHistoria.get(h.id) ?? [];
                const cumplidos = criterios.filter((c) => c.estado === "Cumplido").length;
                const responsable = h.responsable_id ? miembros.get(h.responsable_id) : undefined;
                const anterior = ESTADOS_HISTORIA.at(i - 1);
                const siguiente = ESTADOS_HISTORIA.at(i + 1);
                return (
                  <article
                    key={h.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", h.id);
                      e.dataTransfer.effectAllowed = "move";
                      setArrastrando(h.id);
                    }}
                    onDragEnd={() => {
                      setArrastrando(null);
                      setSobre(null);
                    }}
                    className={cn(
                      "cursor-grab rounded-lg border border-border bg-card p-3 shadow-xs active:cursor-grabbing",
                      arrastrando === h.id && "opacity-50",
                    )}
                  >
                    <Link
                      to="/historias/$id"
                      params={{ id: h.id }}
                      className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary"
                    >
                      {h.codigo && (
                        <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                          {h.codigo}
                        </span>
                      )}
                      {h.titulo}
                    </Link>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge value={h.prioridad} kind="prioridad" />
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs tabular-nums",
                          criterios.length === 0
                            ? "font-medium text-warning"
                            : "text-muted-foreground",
                        )}
                        title="Criterios de aceptación cumplidos"
                      >
                        <ListChecks className="size-3.5" />
                        {criterios.length === 0
                          ? "Sin criterios"
                          : `${cumplidos}/${criterios.length}`}
                      </span>
                      {responsable && (
                        <span title={responsable.nombre}>
                          <Iniciales nombre={responsable.nombre} />
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={i === 0}
                          aria-label={
                            anterior && i > 0 ? `Mover a ${anterior}` : "Sin estado anterior"
                          }
                          title={anterior && i > 0 ? `Mover a ${anterior}` : undefined}
                          onClick={() => anterior && i > 0 && moverA(h, anterior)}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={!siguiente}
                          aria-label={siguiente ? `Mover a ${siguiente}` : "Sin estado siguiente"}
                          title={siguiente ? `Mover a ${siguiente}` : undefined}
                          onClick={() => siguiente && moverA(h, siguiente)}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label="Editar historia"
                          onClick={() => onEditar(h)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label="Eliminar historia"
                          onClick={() => onEliminar(h)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
