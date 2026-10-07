import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generarCriterios } from "./criterios-ai.server";

export const sugerirCriterios = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        titulo: z.string().min(1).max(500),
        rol: z.string().max(1000).nullable(),
        necesidad: z.string().max(2000).nullable(),
        beneficio: z.string().max(2000).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    try {
      return { criterios: await generarCriterios(data), error: null as string | null };
    } catch (e) {
      console.error("[sugerirCriterios]", e);
      // Tras agotar los reintentos, el AI SDK envuelve el error original en `lastError`.
      const err = e as { statusCode?: number; lastError?: { statusCode?: number } };
      const status = err.statusCode ?? err.lastError?.statusCode;
      const msg =
        status === 429
          ? "Demasiadas solicitudes a la IA. Espera un momento e inténtalo de nuevo."
          : status === 400 || status === 403
            ? "La API key de Google Gemini no es válida o no tiene permisos."
            : status !== undefined && status >= 500
              ? "El servicio de Google Gemini está saturado en este momento. Inténtalo de nuevo en unos minutos."
              : e instanceof Error && /abort|timeout/i.test(e.name)
                ? "La IA tardó demasiado en responder. Inténtalo de nuevo."
                : e instanceof Error
                  ? e.message
                  : "Error desconocido";
      return { criterios: [] as string[], error: msg };
    }
  });
