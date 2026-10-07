import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generarHistorias, type HistoriaSugerida } from "./historias-ai.server";
import { mensajeErrorIA } from "./ia-errores";

export const sugerirHistorias = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        nombre: z.string().min(1).max(500),
        descripcion: z.string().max(4000).nullable(),
        existentes: z.array(z.string().max(500)).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    try {
      return { historias: await generarHistorias(data), error: null as string | null };
    } catch (e) {
      console.error("[sugerirHistorias]", e);
      return { historias: [] as HistoriaSugerida[], error: mensajeErrorIA(e) };
    }
  });
