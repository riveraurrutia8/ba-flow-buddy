import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function generarCriterios(h: {
  titulo: string;
  rol: string | null;
  necesidad: string | null;
  beneficio: string | null;
}): Promise<string[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("La IA no está configurada.");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      return res;
    },
  });

  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions:
      "Eres un Business Analyst experto. Redactas criterios de aceptación en español, claros, directos y verificables. " +
      "NO uses formato Gherkin ni las palabras 'Dado que', 'Cuando', 'Entonces'. " +
      "Devuelve entre 3 y 5 criterios, uno por línea, sin numeración, viñetas ni texto adicional.",
    messages: [
      {
        role: "user",
        content: `Historia de usuario:\nTítulo: ${h.titulo}\nComo ${h.rol || "(sin rol)"}, quiero ${h.necesidad || "(sin necesidad)"}, para ${h.beneficio || "(sin beneficio)"}.`,
      },
    ],
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const text = await result.text;
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
  if (lines.length === 0) throw new Error("La IA no devolvió criterios. Inténtalo nuevamente.");
  return lines;
}
