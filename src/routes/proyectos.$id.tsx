import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Columns3,
  List,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, Migas } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { HistoriaDialog } from "@/components/HistoriaDialog";
import { Iniciales } from "@/components/Iniciales";
import { ProyectoDialog } from "@/components/ProyectoDialog";
import { BarraAvance, BarraEstados, LeyendaEstados } from "@/components/ProyectoMetricas";
import { StatusBadge } from "@/components/StatusBadge";
import { TableroBacklog } from "@/components/TableroBacklog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  api,
  ESTADOS_HISTORIA,
  formatFecha,
  PRIORIDADES,
  type Historia,
  type Miembro,
} from "@/lib/baflow";
import { useMoverHistoria } from "@/hooks/use-cambio-estado";
import { diasRestantes, resumenProyecto, TONO_ESTADO } from "@/lib/metricas";
import { cn } from "@/lib/utils";

const PESTANAS = ["resumen", "backlog", "equipo"] as const;
type Pestana = (typeof PESTANAS)[number];

export const Route = createFileRoute("/proyectos/$id")({
  validateSearch: (search: Record<string, unknown>): { tab?: Pestana | undefined } => ({
    tab: PESTANAS.find((t) => t === search["tab"]),
  }),
  head: () => ({
    meta: [
      { title: "Espacio de proyecto — BA Flow" },
      {
        name: "description",
        content: "Resumen, backlog y equipo de un proyecto en BA Flow.",
      },
      { property: "og:title", content: "Espacio de proyecto — BA Flow" },
      {
        property: "og:description",
        content: "Resumen, backlog y equipo de un proyecto en BA Flow.",
      },
    ],
  }),
  component: EspacioProyecto,
});

function EspacioProyecto() {
  const { id } = Route.useParams();
  const { tab = "resumen" } = Route.useSearch();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [editProyecto, setEditProyecto] = useState(false);
  const [historiaDialog, setHistoriaDialog] = useState(false);
  const [editingHistoria, setEditingHistoria] = useState<Historia | null>(null);
  const [historiaToDelete, setHistoriaToDelete] = useState<Historia | null>(null);
  const [confirmProyecto, setConfirmProyecto] = useState(false);
  const [vista, setVista] = useState<"tablero" | "lista">("tablero");
  const mover = useMoverHistoria(id);

  const proyecto = useQuery({ queryKey: ["proyectos", id], queryFn: () => api.getProyecto(id) });
  const historias = useQuery({
    queryKey: ["historias", id],
    queryFn: () => api.listHistorias(id),
  });
  const ids = (historias.data ?? []).map((h) => h.id);
  const criterios = useQuery({
    queryKey: ["criterios", "lote", ids.join(",")],
    queryFn: () => api.listCriteriosDeHistorias(ids),
    enabled: historias.isSuccess,
  });
  const miembros = useQuery({ queryKey: ["miembros"], queryFn: api.listMiembros });

  const delHistoria = useMutation({
    mutationFn: (hid: string) => api.deleteHistoria(hid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["historias"] });
      qc.invalidateQueries({ queryKey: ["criterios"] });
      toast.success("Historia eliminada correctamente.");
      setHistoriaToDelete(null);
    },
    onError: (e: Error) => toast.error(`No se pudo eliminar la historia: ${e.message}`),
  });

  const delProyecto = useMutation({
    mutationFn: () => api.deleteProyecto(id),
    onSuccess: async () => {
      toast.success("Proyecto eliminado correctamente.");
      // Salir del espacio antes de invalidar, para no volver a pedir el proyecto eliminado.
      await navigate({ to: "/" });
      qc.removeQueries({ queryKey: ["proyectos", id] });
      qc.invalidateQueries({ queryKey: ["proyectos"] });
      qc.invalidateQueries({ queryKey: ["historias"] });
    },
    onError: (e: Error) => toast.error(`No se pudo eliminar el proyecto: ${e.message}`),
  });

  if (proyecto.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (proyecto.isError || !proyecto.data) {
    return (
      <div>
        <p className="text-sm text-destructive">No se pudo cargar el proyecto solicitado.</p>
        <Link to="/" className="mt-3 inline-block text-sm text-primary">
          Volver al portafolio
        </Link>
      </div>
    );
  }

  const p = proyecto.data;
  const items = historias.data ?? [];
  const r = resumenProyecto(items, criterios.data ?? []);
  const porId = new Map((miembros.data ?? []).map((m) => [m.id, m]));
  const dias = diasRestantes(p.fecha_objetivo);
  const cargandoBacklog = historias.isLoading || criterios.isLoading;

  const editarHistoria = (h: Historia) => {
    setEditingHistoria(h);
    setHistoriaDialog(true);
  };

  const nuevaHistoria = () => {
    setEditingHistoria(null);
    setHistoriaDialog(true);
  };

  return (
    <div>
      <Migas items={[{ label: "Portafolio", to: "/" }, { label: p.nombre }]} />

      <Card className="mb-6 shadow-xs">
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {p.nombre}
                </h1>
                <StatusBadge value={p.estado} kind="proyecto" />
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {p.descripcion || "Sin descripción."}
              </p>
              <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Inicio {formatFecha(p.fecha_inicio)} · Objetivo {formatFecha(p.fecha_objetivo)}
                {dias !== null && p.estado !== "Finalizado" && (
                  <span className={cn(dias < 0 && "font-medium text-danger")}>
                    ({dias < 0 ? `vencido hace ${-dias} días` : `faltan ${dias} días`})
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditProyecto(true)}>
                <Pencil className="size-4" /> Editar
              </Button>
              <Button variant="outline" onClick={() => setConfirmProyecto(true)}>
                <Trash2 className="size-4 text-destructive" /> Eliminar
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Avance: {r.finalizadas} de {r.total} historias finalizadas
            </p>
            <BarraAvance avance={r.avance} />
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onValueChange={(v) =>
          navigate({
            to: "/proyectos/$id",
            params: { id },
            search: { tab: v as Pestana },
            replace: true,
          })
        }
      >
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="backlog">Backlog ({r.total})</TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          {cargandoBacklog ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Resumen
              r={r}
              onVerBacklog={() =>
                navigate({ to: "/proyectos/$id", params: { id }, search: { tab: "backlog" } })
              }
            />
          )}
        </TabsContent>

        <TabsContent value="backlog" className="mt-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {vista === "tablero"
                ? "Arrastra las historias entre columnas o usa las flechas para cambiar su estado."
                : "Cambia el estado de cada historia desde su selector."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Vista del backlog"
                className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
              >
                {(["tablero", "lista"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={vista === v}
                    onClick={() => setVista(v)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      vista === v && "bg-card text-foreground shadow-xs",
                    )}
                  >
                    {v === "tablero" ? (
                      <Columns3 className="size-4" />
                    ) : (
                      <List className="size-4" />
                    )}
                    {v === "tablero" ? "Tablero" : "Lista"}
                  </button>
                ))}
              </div>
              <Button onClick={nuevaHistoria}>
                <Plus className="size-4" /> Nueva historia
              </Button>
            </div>
          </div>
          {cargandoBacklog ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : historias.isError ? (
            <p className="text-sm text-destructive">Ocurrió un error al cargar las historias.</p>
          ) : items.length === 0 ? (
            <EmptyState
              title="Este proyecto no tiene historias de usuario"
              description="Agrega la primera historia para documentar el alcance funcional."
              action={
                <Button onClick={nuevaHistoria}>
                  <Plus className="size-4" /> Nueva historia
                </Button>
              }
            />
          ) : vista === "tablero" ? (
            <TableroBacklog
              proyectoId={id}
              historias={items}
              criteriosPorHistoria={r.criteriosPorHistoria}
              miembros={porId}
              onEditar={editarHistoria}
              onEliminar={setHistoriaToDelete}
            />
          ) : (
            <div className="space-y-6">
              {ESTADOS_HISTORIA.filter((e) => r.porEstado[e] > 0).map((estado) => (
                <section key={estado}>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className={cn("size-2 rounded-full", TONO_ESTADO[estado])} />
                    {estado}
                    <span className="font-normal text-muted-foreground">{r.porEstado[estado]}</span>
                  </h2>
                  <div className="grid gap-2">
                    {items
                      .filter((h) => h.estado === estado)
                      .map((h) => (
                        <FilaHistoria
                          key={h.id}
                          h={h}
                          responsable={h.responsable_id ? porId.get(h.responsable_id) : undefined}
                          criterios={r.criteriosPorHistoria.get(h.id) ?? []}
                          onCambiarEstado={(estado) => mover.mutate({ historia: h, estado })}
                          onEditar={() => editarHistoria(h)}
                          onEliminar={() => setHistoriaToDelete(h)}
                        />
                      ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="equipo" className="mt-4">
          <EquipoProyecto historias={items} miembros={miembros.data ?? []} />
        </TabsContent>
      </Tabs>

      <ProyectoDialog open={editProyecto} onOpenChange={setEditProyecto} proyecto={p} />
      <HistoriaDialog
        open={historiaDialog}
        onOpenChange={setHistoriaDialog}
        proyectoId={id}
        historia={editingHistoria}
      />
      <ConfirmDelete
        open={!!historiaToDelete}
        onOpenChange={(v) => !v && setHistoriaToDelete(null)}
        title="¿Eliminar historia de usuario?"
        description={`Se eliminará "${historiaToDelete?.titulo ?? ""}" y sus criterios de aceptación.`}
        loading={delHistoria.isPending}
        onConfirm={() => historiaToDelete && delHistoria.mutate(historiaToDelete.id)}
      />
      <ConfirmDelete
        open={confirmProyecto}
        onOpenChange={setConfirmProyecto}
        title="¿Eliminar proyecto?"
        description={`Se eliminará "${p.nombre}" junto con sus historias y criterios. Esta acción no se puede deshacer.`}
        loading={delProyecto.isPending}
        onConfirm={() => delProyecto.mutate()}
      />
    </div>
  );
}

function Resumen({
  r,
  onVerBacklog,
}: {
  r: ReturnType<typeof resumenProyecto>;
  onVerBacklog: () => void;
}) {
  const kpis = [
    { label: "Historias", value: r.total },
    { label: "En curso", value: r.enCurso },
    { label: "Finalizadas", value: r.finalizadas },
    { label: "Criterios cumplidos", value: `${r.criteriosCumplidos}/${r.criteriosTotal}` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-xs">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card className="shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-warning" />
              Requiere atención ({r.alertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {r.alertas.length === 0 ? (
              <p className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-success" />
                Todo en orden: cada historia activa tiene criterios y responsable.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {r.alertas.map(({ historia, motivo }) => (
                  <li key={historia.id}>
                    <Link
                      to="/historias/$id"
                      params={{ id: historia.id }}
                      className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                          {historia.codigo && (
                            <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                              {historia.codigo}
                            </span>
                          )}
                          {historia.titulo}
                        </p>
                        <p className="mt-0.5 text-xs text-warning">{motivo}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Backlog por estado</CardTitle>
              <Button variant="link" className="h-auto p-0 text-sm" onClick={onVerBacklog}>
                Ver backlog
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {r.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay historias en este proyecto.
              </p>
            ) : (
              <>
                <BarraEstados porEstado={r.porEstado} total={r.total} className="h-3" />
                <LeyendaEstados porEstado={r.porEstado} />
              </>
            )}
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Por prioridad</p>
              <div className="flex flex-wrap gap-2">
                {[...PRIORIDADES].reverse().map((pr) => (
                  <PrioridadConteo key={pr} prioridad={pr} r={r} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PrioridadConteo({
  prioridad,
  r,
}: {
  prioridad: string;
  r: ReturnType<typeof resumenProyecto>;
}) {
  const n = r.porPrioridad[prioridad] ?? 0;
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusBadge value={prioridad} kind="prioridad" />
      <span className="text-sm font-semibold tabular-nums text-foreground">{n}</span>
    </span>
  );
}

function FilaHistoria({
  h,
  responsable,
  criterios,
  onCambiarEstado,
  onEditar,
  onEliminar,
}: {
  h: Historia;
  responsable?: Miembro | undefined;
  criterios: { estado: string }[];
  onCambiarEstado: (estado: string) => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const cumplidos = criterios.filter((c) => c.estado === "Cumplido").length;
  return (
    <Card className="shadow-xs">
      <CardContent className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4">
        <div className="min-w-0 flex-1 basis-64">
          <Link
            to="/historias/$id"
            params={{ id: h.id }}
            className="text-sm font-medium text-foreground hover:text-primary"
          >
            {h.codigo && (
              <span className="mr-1.5 font-mono text-xs text-muted-foreground">{h.codigo}</span>
            )}
            {h.titulo}
          </Link>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            Como {h.rol || "—"}, quiero {h.necesidad || "—"}, para {h.beneficio || "—"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={h.estado} onValueChange={onCambiarEstado}>
            <SelectTrigger
              className="h-8 w-48 text-xs"
              aria-label={`Estado de ${h.codigo || h.titulo}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_HISTORIA.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <StatusBadge value={h.prioridad} kind="prioridad" />
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs tabular-nums",
              criterios.length === 0 ? "font-medium text-warning" : "text-muted-foreground",
            )}
            title="Criterios de aceptación cumplidos"
          >
            <ListChecks className="size-3.5" />
            {criterios.length === 0 ? "Sin criterios" : `${cumplidos}/${criterios.length}`}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {responsable ? (
              <>
                <Iniciales nombre={responsable.nombre} />
                {responsable.nombre}
              </>
            ) : (
              "Sin responsable"
            )}
          </span>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" aria-label="Editar historia" onClick={onEditar}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Eliminar historia" onClick={onEliminar}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EquipoProyecto({ historias, miembros }: { historias: Historia[]; miembros: Miembro[] }) {
  const asignados = miembros
    .map((m) => ({ m, hus: historias.filter((h) => h.responsable_id === m.id) }))
    .filter((x) => x.hus.length > 0);
  const sinAsignar = historias.filter((h) => !h.responsable_id).length;

  if (asignados.length === 0) {
    return (
      <EmptyState
        title="Nadie tiene historias asignadas en este proyecto"
        description="Asigna un responsable al editar una historia del backlog."
        action={
          <Button variant="outline" asChild>
            <Link to="/equipo">Gestionar equipo</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {asignados.map(({ m, hus }) => (
          <Card key={m.id} className="shadow-xs">
            <CardContent className="flex items-start gap-3 p-4">
              <Iniciales nombre={m.nombre} grande />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{m.nombre}</p>
                <p className="text-xs text-muted-foreground">{m.rol || "Sin rol"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hus.map((h) => (
                    <Link
                      key={h.id}
                      to="/historias/$id"
                      params={{ id: h.id }}
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:text-primary"
                      title={h.titulo}
                    >
                      {h.codigo || h.titulo}
                    </Link>
                  ))}
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {hus.length} HU
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {sinAsignar > 0
          ? `${sinAsignar} ${sinAsignar === 1 ? "historia sin responsable" : "historias sin responsable"}. `
          : ""}
        <Link to="/equipo" className="text-primary hover:underline">
          Gestionar equipo
        </Link>
      </p>
    </div>
  );
}
