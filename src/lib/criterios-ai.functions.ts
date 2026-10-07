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
      const status = (e as { statusCode?: number }).statusCode;
      const msg =
        status === 429
          ? "Demasiadas solicitudes a la IA. Espera un momento e inténtalo de nuevo."
          : status === 402
            ? "Se agotaron los créditos de IA del espacio de trabajo."
            : e instanceof Error
              ? e.message
              : "Error desconocido";
      return { criterios: [] as string[], error: `No se pudieron generar sugerencias: ${msg}` };
    }
  });
