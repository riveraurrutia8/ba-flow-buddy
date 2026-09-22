import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, ESTADOS_PROYECTO, type Proyecto } from "@/lib/baflow";

type FormState = {
  nombre: string;
  descripcion: string;
  estado: string;
  fecha_inicio: string;
  fecha_objetivo: string;
};

const empty: FormState = {
  nombre: "",
  descripcion: "",
  estado: "Planificación",
  fecha_inicio: "",
  fecha_objetivo: "",
};

export function ProyectoDialog({
  open,
  onOpenChange,
  proyecto,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proyecto?: Proyecto | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      proyecto
        ? {
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion ?? "",
            estado: proyecto.estado,
            fecha_inicio: proyecto.fecha_inicio ?? "",
            fecha_objetivo: proyecto.fecha_objetivo ?? "",
          }
        : empty,
    );
  }, [open, proyecto]);

  const mutation = useMutation({
    mutationFn: async () => {
      const values = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        estado: form.estado,
        fecha_inicio: form.fecha_inicio || null,
        fecha_objetivo: form.fecha_objetivo || null,
      };
      return proyecto ? api.updateProyecto(proyecto.id, values) : api.createProyecto(values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proyectos"] });
      toast.success(proyecto ? "Proyecto actualizado correctamente." : "Proyecto creado correctamente.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(`No se pudo guardar el proyecto: ${e.message}`),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre del proyecto es obligatorio.");
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{proyecto ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
          <DialogDescription>Define la información general del proyecto.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="ERP Gestión de Inventario"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_PROYECTO.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fi">Fecha de inicio</Label>
              <Input
                id="fi"
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fo">Fecha objetivo</Label>
              <Input
                id="fo"
                type="date"
                value={form.fecha_objetivo}
                onChange={(e) => setForm({ ...form, fecha_objetivo: e.target.value })}
              />
            </div>
          </div>
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
