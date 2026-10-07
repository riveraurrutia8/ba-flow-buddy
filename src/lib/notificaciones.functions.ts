import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AnalisisRiesgo = {
  riesgo: string;
  resumen: string;
  observaciones: string[];
};

const respuestaN8nSchema = z.object({
  analizado: z.boolean(),
  riesgo: z.string().max(50).optional(),
  resumen: z.string().max(2000).optional(),
  observaciones: z.array(z.string().max(1000)).max(10).optional(),
});

// Avisa a n8n cuando una historia cambia de estado; n8n la analiza con IA, notifica por Telegram
// y responde con el análisis para mostrarlo en la app.
// Si N8N_WEBHOOK_URL no está configurada o n8n falla, no se interrumpe el guardado.
export const notificarCambioEstado = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        historia_id: z.string().uuid(),
        codigo: z.string().max(100).nullable(),
        titulo: z.string().min(1).max(500),
        rol: z.string().max(1000).nullable(),
        necesidad: z.string().max(2000).nullable(),
        beneficio: z.string().max(2000).nullable(),
        proyecto: z.string().max(500).nullable(),
        prioridad: z.string().max(50),
        responsable: z.string().max(200).nullable(),
        estado_anterior: z.string().max(100),
        estado_nuevo: z.string().max(100),
        url: z.string().url().max(1000),
        criterios: z
          .array(z.object({ descripcion: z.string().max(2000), estado: z.string().max(50) }))
          .max(100),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ enviado: boolean; analisis: AnalisisRiesgo | null }> => {
    const webhookUrl = process.env["N8N_WEBHOOK_URL"];
    if (!webhookUrl) return { enviado: false, analisis: null };

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: "historia.estado_cambiado",
          fecha: new Date().toISOString(),
          ...data,
        }),
        // n8n espera el análisis de Gemini (con reintentos) antes de responder.
        signal: AbortSignal.timeout(50_000),
      });
      if (!res.ok) {
        console.error("[notificarCambioEstado] n8n respondió", res.status);
        return { enviado: false, analisis: null };
      }
      const respuesta = respuestaN8nSchema.safeParse(await res.json().catch(() => null));
      const analisis =
        respuesta.success && respuesta.data.analizado && respuesta.data.riesgo
          ? {
              riesgo: respuesta.data.riesgo,
              resumen: respuesta.data.resumen ?? "",
              observaciones: respuesta.data.observaciones ?? [],
            }
          : null;
      return { enviado: true, analisis };
    } catch (e) {
      console.error("[notificarCambioEstado]", e);
      return { enviado: false, analisis: null };
    }
  });
