import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState, PageHeader } from "@/components/AppShell";
import { ProyectoDialog } from "@/components/ProyectoDialog";
import { BarraAvance, BarraEstados } from "@/components/ProyectoMetricas";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, formatFecha, type Proyecto } from "@/lib/baflow";
import { diasRestantes, resumenProyecto } from "@/lib/metricas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portafolio — BA Flow" },
      {
        name: "description",
        content: "Portafolio de proyectos con su avance, backlog y alertas en BA Flow.",
      },
      { property: "og:title", content: "Portafolio — BA Flow" },
      {
        property: "og:description",
        content: "Portafolio de proyectos con su avance, backlog y alertas en BA Flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Portafolio,
});

function Portafolio() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const proyectos = useQuery({ queryKey: ["proyectos"], queryFn: api.listProyectos });
  const historias = useQuery({ queryKey: ["historias"], queryFn: () => api.listHistorias() });
  const ids = (historias.data ?? []).map((h) => h.id);
  const criterios = useQuery({
    queryKey: ["criterios", "lote", ids.join(",")],
    queryFn: () => api.listCriteriosDeHistorias(ids),
    enabled: historias.isSuccess,
  });

  const loading = proyectos.isLoading || historias.isLoading || criterios.isLoading;
  const ps = proyectos.data ?? [];
  const hs = historias.data ?? [];
  const cs = criterios.data ?? [];
  const resumenes = ps.map((p) => {
    const suyas = hs.filter((h) => h.proyecto_id === p.id);
    const ids = new Set(suyas.map((h) => h.id));
    return {
      proyecto: p,
      ...resumenProyecto(
        suyas,
        cs.filter((c) => ids.has(c.historia_usuario_id)),
      ),
    };
  });
  const totalAlertas = resumenes.reduce((n, r) => n + r.alertas.length, 0);

  const nuevo = (
    <Button onClick={() => setDialogOpen(true)}>
      <Plus className="size-4" /> Nuevo proyecto
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Portafolio"
        description="Cada proyecto tiene su propio espacio: entra para ver su backlog, avance y equipo."
        action={nuevo}
      />

      {proyectos.isError || historias.isError ? (
        <p className="text-sm text-destructive">
          Ocurrió un error al cargar el portafolio. Recarga la página e inténtalo nuevamente.
        </p>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : ps.length === 0 ? (
        <EmptyState
          title="Aún no hay proyectos"
          description="Crea tu primer proyecto para empezar a documentar historias de usuario."
          action={nuevo}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {ps.length} {ps.length === 1 ? "proyecto" : "proyectos"} · {hs.length} historias ·{" "}
            {totalAlertas === 0 ? (
              "todo en orden"
            ) : (
              <span className="font-medium text-warning">
                {totalAlertas} {totalAlertas === 1 ? "requiere" : "requieren"} atención
              </span>
            )}
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resumenes.map((r) => (
              <TarjetaProyecto key={r.proyecto.id} {...r} />
            ))}
          </div>
        </>
      )}

      <ProyectoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(p) =>
          navigate({
            to: "/proyectos/$id",
            params: { id: p.id },
            search: { tab: "backlog", generar: true },
          })
        }
      />
    </div>
  );
}

function TarjetaProyecto({
  proyecto,
  total,
  enCurso,
  avance,
  porEstado,
  alertas,
}: { proyecto: Proyecto } & ReturnType<typeof resumenProyecto>) {
  const dias = diasRestantes(proyecto.fecha_objetivo);
  const vencido = dias !== null && dias < 0 && proyecto.estado !== "Finalizado";

  return (
    <Link
      to="/proyectos/$id"
      params={{ id: proyecto.id }}
      className="group block rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full shadow-xs transition-colors group-hover:border-primary/40">
        <CardContent className="flex h-full flex-col gap-5 pt-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-foreground group-hover:text-primary">
                {proyecto.nombre}
              </h2>
              <StatusBadge value={proyecto.estado} kind="proyecto" />
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {proyecto.descripcion || "Sin descripción."}
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Avance (HU finalizadas)</p>
            <BarraAvance avance={avance} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Backlog · {total} {total === 1 ? "historia" : "historias"}, {enCurso} en curso
            </p>
            <BarraEstados porEstado={porEstado} total={total} />
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs">
            {alertas.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-warning">
                <AlertTriangle className="size-3.5" />
                {alertas.length} {alertas.length === 1 ? "requiere" : "requieren"} atención
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-success">
                <CheckCircle2 className="size-3.5" /> Sin alertas
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 ${vencido ? "font-medium text-danger" : "text-muted-foreground"}`}
            >
              <CalendarDays className="size-3.5" />
              {proyecto.fecha_objetivo
                ? `${formatFecha(proyecto.fecha_objetivo)}${textoDias(dias, proyecto.estado)}`
                : "Sin fecha objetivo"}
              <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function textoDias(dias: number | null, estado: string) {
  if (dias === null || estado === "Finalizado") return "";
  if (dias < 0) return ` · vencido hace ${-dias} d`;
  if (dias === 0) return " · vence hoy";
  return ` · en ${dias} d`;
}
