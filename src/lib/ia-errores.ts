// Traduce un error de la llamada a Gemini a un mensaje claro en español para el usuario.
export function mensajeErrorIA(e: unknown) {
  // Tras agotar los reintentos, el AI SDK envuelve el error original en `lastError`.
  const err = e as { statusCode?: number; lastError?: { statusCode?: number } };
  const status = err.statusCode ?? err.lastError?.statusCode;
  if (status === 429) {
    return "Demasiadas solicitudes a la IA. Espera un momento e inténtalo de nuevo.";
  }
  if (status === 400 || status === 403) {
    return "La API key de Google Gemini no es válida o no tiene permisos.";
  }
  if (status !== undefined && status >= 500) {
    return "El servicio de Google Gemini está saturado en este momento. Inténtalo de nuevo en unos minutos.";
  }
  if (e instanceof Error && /abort|timeout/i.test(e.name)) {
    return "La IA tardó demasiado en responder. Inténtalo de nuevo.";
  }
  return e instanceof Error ? e.message : "Error desconocido";
}
