import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { HistoriaDialog } from "@/components/HistoriaDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { AnalisisRiesgo } from "@/components/AnalisisRiesgo";
import { SugerenciasIA } from "@/components/SugerenciasIA";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Criterio } from "@/lib/baflow";

export const Route = createFileRoute("/historias/$id")({
  head: () => ({
    meta: [
      { title: "Historia de usuario — BA Flow" },
      {
        name: "description",
        content: "Detalle de la historia de usuario y sus criterios de aceptación.",
      },
      { property: "og:title", content: "Historia de usuario — BA Flow" },
      {
        property: "og:description",
        content: "Detalle de la historia de usuario y sus criterios de aceptación.",
      },
    ],
  }),
  component: HistoriaDetalle,
});

function HistoriaDetalle() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const [nuevoError, setNuevoError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [toDelete, setToDelete] = useState<Criterio | null>(null);

  const historia = useQuery({ queryKey: ["historia", id], queryFn: () => api.getHistoria(id) });
  const criterios = useQuery({ queryKey: ["criterios", id], queryFn: () => api.listCriterios(id) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["criterios", id] });

  const crear = useMutation({
    mutationFn: () => api.createCriterio({ historia_usuario_id: id, descripcion: nuevo.trim() }),
    onSuccess: () => {
      invalidate();
      setNuevo("");
      toast.success("Criterio creado correctamente.");
    },
    onError: (e: Error) => toast.error(`No se pudo crear el criterio: ${e.message}`),
  });

  const actualizar = useMutation({
    mutationFn: (v: { cid: string; values: Partial<Criterio> }) =>
      api.updateCriterio(v.cid, v.values),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast.success("Criterio actualizado correctamente.");
    },
    onError: (e: Error) => toast.error(`No se pudo actualizar el criterio: ${e.message}`),
  });

  const eliminar = useMutation({
    mutationFn: (cid: string) => api.deleteCriterio(cid),
    onSuccess: () => {
      invalidate();
      setToDelete(null);
      toast.success("Criterio eliminado correctamente.");
    },
    onError: (e: Error) => toast.error(`No se pudo eliminar el criterio: ${e.message}`),
  });

  if (historia.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (historia.isError || !historia.data) {
    return <p className="text-sm text-destructive">No se pudo cargar la historia de usuario.</p>;
  }

  const h = historia.data;
  const items = criterios.data ?? [];

  return (
    <div>
      <Link
        to="/proyectos/$id"
        params={{ id: h.proyecto_id }}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver al proyecto
      </Link>

      <PageHeader
        title={h.titulo}
        description={h.codigo ? `Código ${h.codigo}` : "Sin código asignado"}
        action={
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Editar historia
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-lg leading-relaxed text-foreground">
            Como <strong className="font-semibold">{h.rol || "—"}</strong>, quiero{" "}
            <strong className="font-semibold">{h.necesidad || "—"}</strong>, para{" "}
            <strong className="font-semibold">{h.beneficio || "—"}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={h.prioridad} kind="prioridad" />
            <StatusBadge value={h.estado} kind="historia" />
          </div>
        </CardContent>
      </Card>

      <AnalisisRiesgo historiaId={h.id} />

      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight text-foreground">
        Criterios de aceptación ({items.length})
      </h2>

      <SugerenciasIA historia={h} />

      <Card className="mb-4">
        <CardContent className="pt-6">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!nuevo.trim()) {
                setNuevoError("La descripción del criterio es obligatoria.");
                return;
              }
              setNuevoError(null);
              crear.mutate();
            }}
          >
            <Input
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder="Nuevo criterio de aceptación"
              className="min-w-48 flex-1"
            />
            <Button type="submit" disabled={crear.isPending}>
              <Plus className="size-4" /> {crear.isPending ? "Agregando..." : "Agregar"}
            </Button>
          </form>
          {nuevoError && <p className="mt-2 text-sm text-destructive">{nuevoError}</p>}
        </CardContent>
      </Card>

      {criterios.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : criterios.isError ? (
        <p className="text-sm text-destructive">Ocurrió un error al cargar los criterios.</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin criterios de aceptación"
          description="Agrega criterios para definir cuándo la historia se considera completa."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-6">
                {editingId === c.id ? (
                  <div className="flex w-full flex-wrap gap-2">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="min-w-48 flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={actualizar.isPending}
                      onClick={() => {
                        if (!editingText.trim()) {
                          toast.error("La descripción del criterio es obligatoria.");
                          return;
                        }
                        actualizar.mutate({
                          cid: c.id,
                          values: { descripcion: editingText.trim() },
                        });
                      }}
                    >
                      <Check className="size-4" /> Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="size-4" /> Cancelar
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="min-w-0 flex-1 text-sm text-foreground">{c.descripcion}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={c.estado} kind="criterio" />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actualizar.isPending}
                        onClick={() =>
                          actualizar.mutate({
                            cid: c.id,
                            values: { estado: c.estado === "Cumplido" ? "Pendiente" : "Cumplido" },
                          })
                        }
                      >
                        {c.estado === "Cumplido" ? (
                          <>
                            <RotateCcw className="size-4" /> Marcar pendiente
                          </>
                        ) : (
                          <>
                            <Check className="size-4" /> Marcar cumplido
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar criterio"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditingText(c.descripcion);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar criterio"
                        onClick={() => setToDelete(c)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HistoriaDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        proyectoId={h.proyecto_id}
        historia={h}
      />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar criterio de aceptación?"
        description="Esta acción no se puede deshacer."
        loading={eliminar.isPending}
        onConfirm={() => toDelete && eliminar.mutate(toDelete.id)}
      />
    </div>
  );
}
