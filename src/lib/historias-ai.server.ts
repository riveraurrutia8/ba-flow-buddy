import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

const historiasSchema = z.object({
  historias: z
    .array(
      z.object({
        titulo: z.string().min(1).describe("Título corto de la historia, máximo 8 palabras."),
        rol: z.string().min(1).describe("Quién la necesita, en minúscula: 'jefe de compras'."),
        necesidad: z.string().min(1).describe("Qué quiere hacer, empezando con un verbo."),
        beneficio: z.string().min(1).describe("Para qué le sirve al negocio."),
        prioridad: z.enum(["Baja", "Media", "Alta", "Crítica"]),
      }),
    )
    .min(3)
    .max(6),
});

export type HistoriaSugerida = z.infer<typeof historiasSchema>["historias"][number];

export async function generarHistorias(p: {
  nombre: string;
  descripcion: string | null;
  existentes: string[];
}): Promise<HistoriaSugerida[]> {
  const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (!apiKey) throw new Error("La IA no está configurada (falta GOOGLE_GENERATIVE_AI_API_KEY).");

  const google = createGoogleGenerativeAI({ apiKey });

  const { output } = await generateText({
    model: google("gemini-3.5-flash-lite"),
    output: Output.object({ schema: historiasSchema }),
    timeout: 45_000,
    system:
      "Eres un Business Analyst senior. A partir de un proyecto de software, propones las historias de usuario " +
      "iniciales de su backlog, en español latinoamericano, con el formato Como [rol], quiero [necesidad], para [beneficio]. " +
      "Cada historia es pequeña, independiente y verificable; cubre una funcionalidad distinta. " +
      "Asigna la prioridad según el valor para el negocio. Genera entre 4 y 6 historias. " +
      "No repitas ni reformules las historias que el proyecto ya tiene.",
    prompt:
      `Proyecto: ${p.nombre}\n` +
      `Descripción: ${p.descripcion || "(sin descripción)"}\n` +
      `Historias que ya existen (no repetir):\n` +
      (p.existentes.map((t) => `- ${t}`).join("\n") || "(ninguna)"),
  });

  return output.historias.map((h) => ({
    ...h,
    titulo: h.titulo.trim(),
    rol: h.rol.trim(),
    necesidad: h.necesidad.trim(),
    beneficio: h.beneficio.trim(),
  }));
}
