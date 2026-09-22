import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { ProyectoDialog } from "@/components/ProyectoDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, formatFecha, type Proyecto } from "@/lib/baflow";

export const Route = createFileRoute("/proyectos/")({
  head: () => ({
    meta: [
      { title: "Proyectos — BA Flow" },
      { name: "description", content: "Listado y gestión de proyectos de software en BA Flow." },
      { property: "og:title", content: "Proyectos — BA Flow" },
      {
        property: "og:description",
        content: "Listado y gestión de proyectos de software en BA Flow.",
      },
    ],
  }),
  component: ProyectosPage,
});

function ProyectosPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [toDelete, setToDelete] = useState<Proyecto | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["proyectos"],
    queryFn: api.listProyectos,
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteProyecto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proyectos"] });
      qc.invalidateQueries({ queryKey: ["historias"] });
      toast.success("Proyecto eliminado correctamente.");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(`No se pudo eliminar el proyecto: ${e.message}`),
  });

  return (
    <div>
      <PageHeader
        title="Proyectos"
        description="Administra los proyectos y accede a sus historias de usuario."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Nuevo proyecto
          </Button>
        }
      />

      {isError && (
        <p className="text-sm text-destructive">
          Ocurrió un error al cargar los proyectos. Inténtalo nuevamente.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="Aún no hay proyectos"
          description="Crea tu primer proyecto para comenzar."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Nuevo proyecto
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        to="/proyectos/$id"
                        params={{ id: p.id }}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {p.nombre}
                      </Link>
                      {p.descripcion && (
                        <p className="line-clamp-1 max-w-sm text-xs text-muted-foreground">
                          {p.descripcion}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={p.estado} kind="proyecto" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFecha(p.fecha_inicio)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFecha(p.fecha_objetivo)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar proyecto"
                        onClick={() => {
                          setEditing(p);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar proyecto"
                        onClick={() => setToDelete(p)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <ProyectoDialog open={dialogOpen} onOpenChange={setDialogOpen} proyecto={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar proyecto?"
        description={`Se eliminará "${toDelete?.nombre ?? ""}" junto con sus historias de usuario y criterios asociados. Esta acción no se puede deshacer.`}
        loading={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
      />
    </div>
  );
}
