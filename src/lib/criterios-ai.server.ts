import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

const criteriosSchema = z.object({
  criterios: z
    .array(z.string().min(1).describe("Un criterio de aceptación en una sola frase directa."))
    .min(3)
    .max(5),
});

export async function generarCriterios(h: {
  titulo: string;
  rol: string | null;
  necesidad: string | null;
  beneficio: string | null;
}): Promise<string[]> {
  const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (!apiKey) throw new Error("La IA no está configurada (falta GOOGLE_GENERATIVE_AI_API_KEY).");

  const google = createGoogleGenerativeAI({ apiKey });

  const { output } = await generateText({
    model: google("gemini-3.5-flash"),
    output: Output.object({ schema: criteriosSchema }),
    timeout: 45_000,
    system:
      "Eres un Business Analyst experto. Redactas criterios de aceptación en español latinoamericano, " +
      "claros, directos y verificables. NO uses formato Gherkin ni las palabras 'Dado que', 'Cuando', 'Entonces'. " +
      "Cada criterio es una sola frase que dice qué debe cumplirse, sin numeración ni viñetas. " +
      "Genera entre 3 y 5 criterios.",
    prompt:
      `Historia de usuario:\nTítulo: ${h.titulo}\n` +
      `Descripción: Como ${h.rol || "(sin rol)"}, quiero ${h.necesidad || "(sin necesidad)"}, ` +
      `para ${h.beneficio || "(sin beneficio)"}.`,
  });

  const criterios = output.criterios.map((c) => c.trim()).filter(Boolean);
  if (criterios.length === 0) throw new Error("La IA no devolvió criterios. Inténtalo nuevamente.");
  return criterios;
}
