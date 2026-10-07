import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { api, type Historia } from "@/lib/baflow";
import { notificarCambioEstado } from "@/lib/notificaciones.functions";

// Avisa a n8n de un cambio de estado y muestra el análisis de riesgo que devuelve.
// Corre en segundo plano: si falla, el cambio de estado ya quedó guardado igual.
export function useAvisoCambioEstado() {
  const qc = useQueryClient();
  const notificar = useServerFn(notificarCambioEstado);

  async function enviar(guardada: Historia, estadoAnterior: string) {
    const [proyecto, criterios, miembros] = await Promise.all([
      qc
        .fetchQuery({
          queryKey: ["proyectos", guardada.proyecto_id],
          queryFn: () => api.getProyecto(guardada.proyecto_id),
        })
        .catch(() => null),
      qc
        .fetchQuery({
          queryKey: ["criterios", guardada.id],
          queryFn: () => api.listCriterios(guardada.id),
        })
        .catch(() => []),
      qc.fetchQuery({ queryKey: ["miembros"], queryFn: api.listMiembros }).catch(() => []),
    ]);
    return notificar({
      data: {
        historia_id: guardada.id,
        codigo: guardada.codigo,
        titulo: guardada.titulo,
        rol: guardada.rol,
        necesidad: guardada.necesidad,
        beneficio: guardada.beneficio,
        criterios: criterios.map((c) => ({ descripcion: c.descripcion, estado: c.estado })),
        proyecto: proyecto?.nombre ?? null,
        prioridad: guardada.prioridad,
        responsable: miembros.find((m) => m.id === guardada.responsable_id)?.nombre ?? null,
        estado_anterior: estadoAnterior,
        estado_nuevo: guardada.estado,
        url: `${window.location.origin}/historias/${guardada.id}`,
      },
    });
  }

  return async function avisar(guardada: Historia, estadoAnterior: string) {
    const aviso = toast.loading("Notificando el cambio de estado y analizando la historia…");
    const res = await enviar(guardada, estadoAnterior).catch(() => null);
    if (!res?.enviado) {
      toast.dismiss(aviso);
      return;
    }
    if (!res.analisis) {
      toast.success("Equipo notificado por Telegram.", { id: aviso });
      return;
    }
    const analisis = { ...res.analisis, estado: guardada.estado, fecha: new Date().toISOString() };
    qc.setQueryData(["analisis", guardada.id], analisis);
    const opciones = { id: aviso, description: analisis.resumen, duration: 10_000 };
    if (analisis.riesgo === "Alto") {
      toast.warning(`Riesgo ALTO detectado por la IA en "${guardada.titulo}"`, opciones);
    } else {
      toast.success(`Análisis de IA: riesgo ${analisis.riesgo}`, opciones);
    }
  };
}

// Mueve una historia a otro estado desde el tablero, sin abrir el formulario.
export function useMoverHistoria(proyectoId: string) {
  const qc = useQueryClient();
  const avisar = useAvisoCambioEstado();
  const clave = ["historias", proyectoId];

  return useMutation({
    mutationFn: ({ historia, estado }: { historia: Historia; estado: string }) =>
      api.updateHistoria(historia.id, { estado }),
    onMutate: async ({ historia, estado }) => {
      await qc.cancelQueries({ queryKey: clave });
      const previas = qc.getQueryData<Historia[]>(clave);
      qc.setQueryData<Historia[]>(clave, (hs) =>
        hs?.map((h) => (h.id === historia.id ? { ...h, estado } : h)),
      );
      return { previas };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.previas) qc.setQueryData(clave, ctx.previas);
      toast.error(`No se pudo cambiar el estado: ${e.message}`);
    },
    onSuccess: (guardada, { historia }) => {
      toast.success(`${guardada.codigo || guardada.titulo} pasó a «${guardada.estado}».`);
      void avisar(guardada, historia.estado);
    },
    onSettled: (_data, _err, { historia }) => {
      qc.invalidateQueries({ queryKey: ["historias"] });
      qc.invalidateQueries({ queryKey: ["historia", historia.id] });
    },
  });
}
