import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Check, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, PRIORIDADES, type Historia, type Proyecto } from "@/lib/baflow";
import { sugerirHistorias } from "@/lib/historias-ai.functions";

type Sugerida = {
  key: number;
  incluir: boolean;
  titulo: string;
  rol: string;
  necesidad: string;
  beneficio: string;
  prioridad: string;
};

// Siguiente código libre (HU-009, HU-010…) mirando las historias de todos los proyectos.
function siguientesCodigos(todas: Historia[], cantidad: number) {
  const max = Math.max(0, ...todas.map((h) => Number(/^HU-(\d+)$/.exec(h.codigo ?? "")?.[1] ?? 0)));
  return Array.from({ length: cantidad }, (_, i) => `HU-${String(max + i + 1).padStart(3, "0")}`);
}

export function GeneradorHistorias({
  proyecto,
  existentes,
  generarAlAbrir,
  onCerrar,
}: {
  proyecto: Proyecto;
  existentes: Historia[];
  generarAlAbrir?: boolean;
  onCerrar: () => void;
}) {
  const qc = useQueryClient();
  const sugerir = useServerFn(sugerirHistorias);
  const [sugeridas, setSugeridas] = useState<Sugerida[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Estado de carga propio (no useMutation): la generación automática se dispara desde un
  // efecto, y en desarrollo React monta el componente dos veces, lo que dejaba el botón atascado.
  const [generando, setGenerando] = useState(false);
  const generar = async () => {
    setError(null);
    setSugeridas([]);
    setGenerando(true);
    try {
      const res = await sugerir({
        data: {
          nombre: proyecto.nombre,
          descripcion: proyecto.descripcion,
          existentes: existentes.map((h) => h.titulo),
        },
      });
      if (res.error) setError(res.error);
      else
        setSugeridas(res.historias.map((h, i) => ({ ...h, key: Date.now() + i, incluir: true })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setGenerando(false);
    }
  };

  // Al llegar desde "Nuevo proyecto", la generación arranca sola una vez.
  const yaGenero = useRef(false);
  useEffect(() => {
    if (generarAlAbrir && !yaGenero.current) {
      yaGenero.current = true;
      void generar();
    }
    // Solo depende de generarAlAbrir: generar cambia en cada render y el ref evita repetir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generarAlAbrir]);

  const elegidas = sugeridas.filter((s) => s.incluir && s.titulo.trim());

  const guardar = useMutation({
    mutationFn: async () => {
      const todas = await qc.fetchQuery({
        queryKey: ["historias"],
        queryFn: () => api.listHistorias(),
      });
      const codigos = siguientesCodigos(todas, elegidas.length);
      for (const [i, s] of elegidas.entries()) {
        await api.createHistoria({
          proyecto_id: proyecto.id,
          codigo: codigos.at(i) ?? null,
          titulo: s.titulo.trim(),
          rol: s.rol.trim() || null,
          necesidad: s.necesidad.trim() || null,
          beneficio: s.beneficio.trim() || null,
          prioridad: s.prioridad,
          estado: "Borrador",
        });
      }
      return elegidas.length;
    },
    onSuccess: (n) => {
      toast.success(
        n === 1 ? "Se agregó 1 historia al backlog." : `Se agregaron ${n} historias al backlog.`,
      );
      setSugeridas([]);
      onCerrar();
    },
    onError: (e: Error) => toast.error(`No se pudieron guardar las historias: ${e.message}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ["historias"] }),
  });

  const editar = (key: number, cambios: Partial<Sugerida>) =>
    setSugeridas((prev) => prev.map((s) => (s.key === key ? { ...s, ...cambios } : s)));

  return (
    <Card className="mb-4 border-primary/30 shadow-xs">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 text-primary" /> Historias sugeridas con IA
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gemini propone historias a partir del nombre y la descripción del proyecto. Revísalas
              antes de agregarlas: entran como Borrador.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={generando || guardar.isPending}
              onClick={() => void generar()}
            >
              <Sparkles className="size-4" />
              {generando
                ? "Generando…"
                : sugeridas.length > 0
                  ? "Generar otras"
                  : "Generar historias"}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Cerrar generador" onClick={onCerrar}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {generando && (
          <div className="space-y-2" aria-live="polite" aria-busy="true">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>No se pudieron generar historias</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {sugeridas.length > 0 && (
          <div className="space-y-3">
            {sugeridas.map((s, i) => (
              <div
                key={s.key}
                className={`space-y-2 rounded-lg border border-border p-3 transition-opacity ${s.incluir ? "bg-card" : "bg-muted/30 opacity-60"}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Checkbox
                    checked={s.incluir}
                    onCheckedChange={(v) => editar(s.key, { incluir: v === true })}
                    aria-label={`Incluir historia sugerida ${i + 1}`}
                  />
                  <Input
                    value={s.titulo}
                    onChange={(e) => editar(s.key, { titulo: e.target.value })}
                    aria-label={`Título de la historia sugerida ${i + 1}`}
                    className="h-9 min-w-48 flex-1 font-medium"
                  />
                  <Select
                    value={s.prioridad}
                    onValueChange={(v) => editar(s.key, { prioridad: v })}
                  >
                    <SelectTrigger
                      className="h-9 w-32"
                      aria-label={`Prioridad de la historia ${i + 1}`}
                    >
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
                <div className="grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["rol", "Como"],
                      ["necesidad", "quiero"],
                      ["beneficio", "para"],
                    ] as const
                  ).map(([campo, etiqueta]) => (
                    <label
                      key={campo}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="w-12 shrink-0 text-right">{etiqueta}</span>
                      <Input
                        value={s[campo]}
                        onChange={(e) => editar(s.key, { [campo]: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                disabled={guardar.isPending}
                onClick={() => setSugeridas([])}
              >
                Descartar todas
              </Button>
              <Button
                disabled={guardar.isPending || elegidas.length === 0}
                onClick={() => guardar.mutate()}
              >
                <Check className="size-4" />
                {guardar.isPending
                  ? "Agregando…"
                  : `Agregar ${elegidas.length} ${elegidas.length === 1 ? "historia" : "historias"}`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
