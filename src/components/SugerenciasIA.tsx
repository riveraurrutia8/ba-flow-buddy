import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Check, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api, type Historia } from "@/lib/baflow";
import { sugerirCriterios } from "@/lib/criterios-ai.functions";

type Sugerencia = { key: number; texto: string };

export function SugerenciasIA({ historia }: { historia: Historia }) {
  const qc = useQueryClient();
  const sugerir = useServerFn(sugerirCriterios);
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generar = useMutation({
    mutationFn: () =>
      sugerir({
        data: {
          titulo: historia.titulo,
          rol: historia.rol,
          necesidad: historia.necesidad,
          beneficio: historia.beneficio,
        },
      }),
    onMutate: () => {
      setError(null);
      setSugerencias([]);
    },
    onSuccess: (res) => {
      if (res.error) {
        setError(res.error);
        return;
      }
      setSugerencias(res.criterios.map((texto, i) => ({ key: Date.now() + i, texto })));
    },
    onError: (e: Error) => setError(e.message),
  });

  const guardar = useMutation({
    mutationFn: async (textos: string[]) => {
      for (const descripcion of textos) {
        await api.createCriterio({ historia_usuario_id: historia.id, descripcion });
      }
    },
    onSuccess: (_, textos) => {
      qc.invalidateQueries({ queryKey: ["criterios", historia.id] });
      setSugerencias([]);
      toast.success(
        textos.length === 1
          ? "Se guardó 1 criterio sugerido."
          : `Se guardaron ${textos.length} criterios sugeridos.`,
      );
    },
    onError: (e: Error) => {
      qc.invalidateQueries({ queryKey: ["criterios", historia.id] });
      toast.error(`No se pudieron guardar los criterios: ${e.message}`);
    },
  });

  const validas = sugerencias.map((s) => s.texto.trim()).filter(Boolean);

  return (
    <Card className="mb-4">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Genera propuestas a partir del título y la descripción de la historia.
          </p>
          <Button
            variant="outline"
            disabled={generar.isPending || guardar.isPending}
            onClick={() => generar.mutate()}
          >
            <Sparkles className="size-4" />
            {generar.isPending
              ? "Generando sugerencias..."
              : "Sugerir Criterios de Aceptación con IA"}
          </Button>
        </div>

        {generar.isPending && (
          <div className="space-y-2" aria-live="polite" aria-busy="true">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>No se pudieron generar sugerencias</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {sugerencias.length > 0 && (
          <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">
              Criterios sugeridos — revísalos, edítalos o descártalos antes de guardar.
            </p>
            {sugerencias.map((s, i) => (
              <div key={s.key} className="flex items-start gap-2">
                <Textarea
                  rows={2}
                  value={s.texto}
                  aria-label={`Criterio sugerido ${i + 1}`}
                  onChange={(e) =>
                    setSugerencias((prev) =>
                      prev.map((p) => (p.key === s.key ? { ...p, texto: e.target.value } : p)),
                    )
                  }
                  className="min-h-0 flex-1 bg-card field-sizing-content"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Descartar criterio sugerido ${i + 1}`}
                  onClick={() => setSugerencias((prev) => prev.filter((p) => p.key !== s.key))}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                disabled={guardar.isPending}
                onClick={() => setSugerencias([])}
              >
                Descartar todos
              </Button>
              <Button
                disabled={guardar.isPending || validas.length === 0}
                onClick={() => guardar.mutate(validas)}
              >
                <Check className="size-4" />
                {guardar.isPending
                  ? "Guardando..."
                  : `Guardar ${validas.length} ${validas.length === 1 ? "criterio" : "criterios"}`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
