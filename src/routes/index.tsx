import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, FolderKanban, Rocket, Search } from "lucide-react";

import { EmptyState, PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, formatFecha } from "@/lib/baflow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BA Flow" },
      {
        name: "description",
        content: "Resumen de proyectos, historias de usuario y su avance en BA Flow.",
      },
      { property: "og:title", content: "Dashboard — BA Flow" },
      {
        property: "og:description",
        content: "Resumen de proyectos, historias de usuario y su avance en BA Flow.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const proyectos = useQuery({ queryKey: ["proyectos"], queryFn: api.listProyectos });
  const historias = useQuery({ queryKey: ["historias"], queryFn: () => api.listHistorias() });

  const loading = proyectos.isLoading || historias.isLoading;
  const hs = historias.data ?? [];
  const count = (estado: string) => hs.filter((h) => h.estado === estado).length;

  const cards = [
    { label: "Proyectos", value: proyectos.data?.length ?? 0, icon: FolderKanban },
    { label: "Historias de usuario", value: hs.length, icon: ClipboardList },
    { label: "En análisis", value: count("En análisis"), icon: Search },
    { label: "Listas para desarrollo", value: count("Lista para desarrollo"), icon: Rocket },
    { label: "Finalizadas", value: count("Finalizada"), icon: CheckCircle2 },
  ];

  if (proyectos.isError || historias.isError) {
    return (
      <p className="text-sm text-destructive">
        Ocurrió un error al cargar la información. Recarga la página e inténtalo nuevamente.
      </p>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Visión general del trabajo de análisis." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Proyectos recientes</h2>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (proyectos.data ?? []).length === 0 ? (
          <EmptyState
            title="Aún no hay proyectos"
            description="Crea tu primer proyecto para empezar a documentar historias de usuario."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(proyectos.data ?? []).slice(0, 4).map((p) => (
              <Link key={p.id} to="/proyectos/$id" params={{ id: p.id }} className="block">
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base">{p.nombre}</CardTitle>
                      <StatusBadge value={p.estado} kind="proyecto" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {p.descripcion || "Sin descripción."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hs.filter((h) => h.proyecto_id === p.id).length} historias · Objetivo:{" "}
                      {formatFecha(p.fecha_objetivo)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
