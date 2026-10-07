import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAvisoCambioEstado } from "@/hooks/use-cambio-estado";
import { api, ESTADOS_HISTORIA, PRIORIDADES, type Historia } from "@/lib/baflow";

type FormState = {
  codigo: string;
  titulo: string;
  rol: string;
  necesidad: string;
  beneficio: string;
  prioridad: string;
  estado: string;
  responsable_id: string;
};

const empty: FormState = {
  codigo: "",
  titulo: "",
  rol: "",
  necesidad: "",
  beneficio: "",
  prioridad: "Media",
  estado: "Borrador",
  responsable_id: "",
};

export function HistoriaDialog({
  open,
  onOpenChange,
  proyectoId,
  historia,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proyectoId: string;
  historia?: Historia | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const { data: miembros } = useQuery({
    queryKey: ["miembros"],
    queryFn: api.listMiembros,
    enabled: open,
  });
  const avisarCambioEstado = useAvisoCambioEstado();

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      historia
        ? {
            codigo: historia.codigo ?? "",
            titulo: historia.titulo,
            rol: historia.rol ?? "",
            necesidad: historia.necesidad ?? "",
            beneficio: historia.beneficio ?? "",
            prioridad: historia.prioridad,
            estado: historia.estado,
            responsable_id: historia.responsable_id ?? "",
          }
        : empty,
    );
  }, [open, historia]);

  const mutation = useMutation({
    mutationFn: async () => {
      const values = {
        proyecto_id: proyectoId,
        codigo: form.codigo.trim() || null,
        titulo: form.titulo.trim(),
        rol: form.rol.trim() || null,
        necesidad: form.necesidad.trim() || null,
        beneficio: form.beneficio.trim() || null,
        prioridad: form.prioridad,
        estado: form.estado,
        responsable_id: form.responsable_id || null,
      };
      return historia ? api.updateHistoria(historia.id, values) : api.createHistoria(values);
    },
    onSuccess: (guardada) => {
      if (historia && guardada.estado !== historia.estado) {
        // En segundo plano: un fallo de la notificación no afecta el guardado.
        void avisarCambioEstado(guardada, historia.estado);
      }
      qc.invalidateQueries({ queryKey: ["historias"] });
      if (historia) qc.invalidateQueries({ queryKey: ["historia", historia.id] });
      toast.success(
        historia ? "Historia actualizada correctamente." : "Historia creada correctamente.",
      );
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(`No se pudo guardar la historia: ${e.message}`),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      setError("El título de la historia es obligatorio.");
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {historia ? "Editar historia de usuario" : "Nueva historia de usuario"}
          </DialogTitle>
          <DialogDescription>Como [rol], quiero [necesidad], para [beneficio].</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="HU-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Input
              id="rol"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              placeholder="encargado de bodega"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="necesidad">Necesidad</Label>
            <Textarea
              id="necesidad"
              rows={2}
              value={form.necesidad}
              onChange={(e) => setForm({ ...form, necesidad: e.target.value })}
              placeholder="consultar las existencias disponibles"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beneficio">Beneficio</Label>
            <Textarea
              id="beneficio"
              rows={2}
              value={form.beneficio}
              onChange={(e) => setForm({ ...form, beneficio: e.target.value })}
              placeholder="reponer stock a tiempo"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={form.prioridad}
                onValueChange={(v) => setForm({ ...form, prioridad: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger>
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
            </div>
          </div>
          <div className="space-y-2">
            <Label>Responsable</Label>
            <Select
              value={form.responsable_id || "none"}
              onValueChange={(v) => setForm({ ...form, responsable_id: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {(miembros ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nombre}
                    {m.rol ? ` — ${m.rol}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
