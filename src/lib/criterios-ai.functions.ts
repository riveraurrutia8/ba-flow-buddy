import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generarCriterios } from "./criterios-ai.server";
import { mensajeErrorIA } from "./ia-errores";

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
      return { criterios: [] as string[], error: mensajeErrorIA(e) };
    }
  });
