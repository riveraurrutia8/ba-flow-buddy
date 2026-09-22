import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { HistoriaDialog } from "@/components/HistoriaDialog";
import { ProyectoDialog } from "@/components/ProyectoDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, formatFecha, type Historia } from "@/lib/baflow";

export const Route = createFileRoute("/proyectos/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de proyecto — BA Flow" },
      {
        name: "description",
        content: "Información del proyecto e historias de usuario asociadas.",
      },
      { property: "og:title", content: "Detalle de proyecto — BA Flow" },
      {
        property: "og:description",
        content: "Información del proyecto e historias de usuario asociadas.",
      },
    ],
  }),
  component: ProyectoDetalle,
});

function ProyectoDetalle() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [editProyecto, setEditProyecto] = useState(false);
  const [historiaDialog, setHistoriaDialog] = useState(false);
  const [editingHistoria, setEditingHistoria] = useState<Historia | null>(null);
  const [historiaToDelete, setHistoriaToDelete] = useState<Historia | null>(null);
  const [confirmProyecto, setConfirmProyecto] = useState(false);

  const proyecto = useQuery({ queryKey: ["proyectos", id], queryFn: () => api.getProyecto(id) });
  const historias = useQuery({
    queryKey: ["historias", id],
    queryFn: () => api.listHistorias(id),
  });

  const delHistoria = useMutation({
    mutationFn: (hid: string) => api.deleteHistoria(hid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["historias"] });
      toast.success("Historia eliminada correctamente.");
      setHistoriaToDelete(null);
    },
    onError: (e: Error) => toast.error(`No se pudo eliminar la historia: ${e.message}`),
  });

  const delProyecto = useMutation({
    mutationFn: () => api.deleteProyecto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proyectos"] });
      toast.success("Proyecto eliminado correctamente.");
      navigate({ to: "/proyectos" });
    },
    onError: (e: Error) => toast.error(`No se pudo eliminar el proyecto: ${e.message}`),
  });

  if (proyecto.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (proyecto.isError || !proyecto.data) {
    return (
      <div>
        <p className="text-sm text-destructive">No se pudo cargar el proyecto solicitado.</p>
        <Link to="/proyectos" className="mt-3 inline-block text-sm text-primary">
          Volver a proyectos
        </Link>
      </div>
    );
  }

  const p = proyecto.data;
  const items = historias.data ?? [];

  return (
    <div>
      <Link
        to="/proyectos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Proyectos
      </Link>

      <PageHeader
        title={p.nombre}
        description={p.descripcion ?? "Sin descripción."}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditProyecto(true)}>
              <Pencil className="size-4" /> Editar
            </Button>
            <Button variant="outline" onClick={() => setConfirmProyecto(true)}>
              <Trash2 className="size-4 text-destructive" /> Eliminar
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Info label="Estado">
            <StatusBadge value={p.estado} kind="proyecto" />
          </Info>
          <Info label="Fecha de inicio">{formatFecha(p.fecha_inicio)}</Info>
          <Info label="Fecha objetivo">{formatFecha(p.fecha_objetivo)}</Info>
        </CardContent>
      </Card>

      <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Historias de usuario ({items.length})
        </h2>
        <Button
          onClick={() => {
            setEditingHistoria(null);
            setHistoriaDialog(true);
          }}
        >
          <Plus className="size-4" /> Nueva historia
        </Button>
      </div>

      {historias.isLoading ? (
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
        />
      ) : (
        <div className="grid gap-3">
          {items.map((h) => (
            <Card key={h.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {h.codigo && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {h.codigo}
                      </span>
                    )}
                    <Link
                      to="/historias/$id"
                      params={{ id: h.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {h.titulo}
                    </Link>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    Como {h.rol || "—"}, quiero {h.necesidad || "—"}, para {h.beneficio || "—"}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={h.prioridad} kind="prioridad" />
                  <StatusBadge value={h.estado} kind="historia" />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar historia"
                    onClick={() => {
                      setEditingHistoria(h);
                      setHistoriaDialog(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar historia"
                    onClick={() => setHistoriaToDelete(h)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}
