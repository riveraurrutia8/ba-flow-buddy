import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, type Miembro } from "@/lib/baflow";

export const Route = createFileRoute("/equipo")({
  head: () => ({
    meta: [
      { title: "Equipo — BA Flow" },
      { name: "description", content: "Miembros del equipo responsables de las historias de usuario." },
      { property: "og:title", content: "Equipo — BA Flow" },
      { property: "og:description", content: "Miembros del equipo responsables de las historias de usuario." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EquipoPage,
});

function EquipoPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Miembro | null>(null);
  const [toDelete, setToDelete] = useState<Miembro | null>(null);
  const { data, isLoading, isError } = useQuery({ queryKey: ["miembros"], queryFn: api.listMiembros });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteMiembro(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["miembros"] });
      qc.invalidateQueries({ queryKey: ["historias"] });
      toast.success("Miembro eliminado correctamente.");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(`No se pudo eliminar el miembro: ${e.message}`),
  });

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Equipo"
        description="Miembros que pueden ser responsables de historias de usuario."
        action={
          <Button onClick={openNew}>
            <Plus className="size-4" /> Nuevo miembro
          </Button>
        }
      />
      {isError && <p className="text-sm text-destructive">Ocurrió un error al cargar el equipo.</p>}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="Aún no hay miembros"
          description="Agrega miembros para asignarlos como responsables."
          action={
            <Button onClick={openNew}>
              <Plus className="size-4" /> Nuevo miembro
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
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nombre}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.correo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.rol || "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar miembro"
                        onClick={() => {
                          setEditing(m);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Eliminar miembro" onClick={() => setToDelete(m)}>
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
      <MiembroDialog open={dialogOpen} onOpenChange={setDialogOpen} miembro={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar miembro?"
        description={`Se eliminará "${toDelete?.nombre ?? ""}". Las historias que tenga asignadas quedarán sin responsable.`}
        loading={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
      />
    </div>
  );
}

function MiembroDialog({
  open,
  onOpenChange,
  miembro,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  miembro: Miembro | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ nombre: "", correo: "", rol: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      miembro
        ? { nombre: miembro.nombre, correo: miembro.correo, rol: miembro.rol ?? "" }
        : { nombre: "", correo: "", rol: "" },
    );
  }, [open, miembro]);

  const mutation = useMutation({
    mutationFn: async () => {
      const values = { nombre: form.nombre.trim(), correo: form.correo.trim(), rol: form.rol.trim() || null };
      return miembro ? api.updateMiembro(miembro.id, values) : api.createMiembro(values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["miembros"] });
      toast.success(miembro ? "Miembro actualizado correctamente." : "Miembro creado correctamente.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(`No se pudo guardar el miembro: ${e.message}`),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.correo.trim()) {
      setError("El nombre y el correo son obligatorios.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{miembro ? "Editar miembro" : "Nuevo miembro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="m-nombre">Nombre *</Label>
            <Input id="m-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-correo">Correo *</Label>
            <Input
              id="m-correo"
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-rol">Rol</Label>
            <Input id="m-rol" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
