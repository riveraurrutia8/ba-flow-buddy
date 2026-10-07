import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalisisRiesgo as Analisis } from "@/lib/notificaciones.functions";

export type AnalisisGuardado = Analisis & { estado: string; fecha: string };

// Muestra el último análisis que n8n devolvió al cambiar el estado de la historia.
// Vive en la caché de la sesión (no en la base de datos), así que se pierde al recargar.
export function AnalisisRiesgo({ historiaId }: { historiaId: string }) {
  const { data } = useQuery<AnalisisGuardado | null>({
    queryKey: ["analisis", historiaId],
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!data) return null;

  return (
    <Card className="mt-4">
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bot className="size-4 text-primary" /> Análisis de calidad (IA)
          </h2>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            Riesgo <StatusBadge value={data.riesgo} kind="riesgo" />
          </span>
        </div>
        <p className="text-sm text-foreground">{data.resumen}</p>
        {data.observaciones.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {data.observaciones.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Generado por n8n + Gemini al pasar a «{data.estado}» ·{" "}
          {new Date(data.fecha).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </CardContent>
    </Card>
  );
}
