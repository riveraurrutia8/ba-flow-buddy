import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Rocket,
  Search,
} from "lucide-react";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const estados = [
  { label: "Borrador", tone: "bg-muted-foreground" },
  { label: "En análisis", tone: "bg-info" },
  { label: "Lista para desarrollo", tone: "bg-accent-strong" },
  { label: "En desarrollo", tone: "bg-warning" },
  { label: "Validación", tone: "bg-warning" },
  { label: "Finalizada", tone: "bg-success" },
] as const;

const prioridades = [
  { label: "Crítica", tone: "bg-danger" },
  { label: "Alta", tone: "bg-warning" },
  { label: "Media", tone: "bg-info" },
  { label: "Baja", tone: "bg-muted-foreground" },
] as const;

const widthClasses = [
  "w-0",
  "w-[10%]",
  "w-1/5",
  "w-[30%]",
  "w-2/5",
  "w-1/2",
  "w-3/5",
  "w-[70%]",
  "w-4/5",
  "w-[90%]",
  "w-full",
] as const;

function getWidthClass(value: number, maximum: number) {
  if (value === 0 || maximum === 0) return widthClasses[0];
  const step = Math.max(1, Math.ceil((value / maximum) * 10));
  return widthClasses[step] ?? widthClasses[10];
}

function BreakdownPanel({
  title,
  items,
  loading,
}: {
  title: string;
  items: { label: string; value: number; tone: string }[];
  loading: boolean;
}) {
  const maximum = Math.max(...items.map((item) => item.value), 0);

  return (
    <Card className="h-full shadow-xs">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[minmax(8rem,1fr)_2fr_2rem] items-center gap-3">
            <span className="truncate text-sm text-muted-foreground">{item.label}</span>
            {loading ? (
              <Skeleton className="h-2 w-full" />
            ) : (
              <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${item.tone} ${getWidthClass(item.value, maximum)}`}
                />
              </div>
            )}
            {loading ? (
              <Skeleton className="h-5 w-6" />
            ) : (
              <span className="text-right text-sm font-semibold tabular-nums text-foreground">{item.value}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const proyectos = useQuery({ queryKey: ["proyectos"], queryFn: api.listProyectos });
  const historias = useQuery({ queryKey: ["historias"], queryFn: () => api.listHistorias() });

  const loading = proyectos.isLoading || historias.isLoading;
  const ps = proyectos.data ?? [];
  const hs = historias.data ?? [];
  const count = (estado: string) => hs.filter((h) => h.estado === estado).length;
  const countPrioridad = (prioridad: string) => hs.filter((h) => h.prioridad === prioridad).length;
  const recentProjects = [...ps]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 4);
  const recentStories = [...hs]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 5);
  const projectNames = new Map(ps.map((proyecto) => [proyecto.id, proyecto.nombre]));

  const cards = [
    { label: "Proyectos", value: ps.length, icon: FolderKanban },
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
      <div className="mb-6 border-b border-border pb-5 [&>div]:mb-0">
        <PageHeader title="Dashboard" description="Visión general del trabajo de análisis." />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="h-24 shadow-xs">
            <CardContent className="flex h-full items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
                <div className="mt-1">
                  {loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
                  )}
                </div>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-9">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Resumen del backlog</h2>
          <p className="mt-1 text-sm text-muted-foreground">Distribución actual de las historias de usuario.</p>
        </div>
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <BreakdownPanel
            title="Historias por estado"
            loading={loading}
            items={estados.map((item) => ({ ...item, value: count(item.label) }))}
          />
          <BreakdownPanel
            title="Historias por prioridad"
            loading={loading}
            items={prioridades.map((item) => ({ ...item, value: countPrioridad(item.label) }))}
          />
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Actividad del proyecto</h2>
          <p className="mt-1 text-sm text-muted-foreground">Últimos elementos incorporados al trabajo de análisis.</p>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Proyectos recientes</CardTitle>
                <FolderKanban className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-4 p-5">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="Aún no hay proyectos"
                    description="Crea tu primer proyecto para empezar a documentar historias de usuario."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      to="/proyectos/$id"
                      params={{ id: project.id }}
                      className="group block p-5 transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{project.nombre}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {project.descripcion || "Sin descripción."}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <StatusBadge value={project.estado} kind="proyecto" />
                        {project.fecha_objetivo && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5" />
                            Objetivo: {formatFecha(project.fecha_objetivo)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-xs">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Historias recientes</CardTitle>
                <ClipboardList className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-4 p-5">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : recentStories.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="Aún no hay historias"
                    description="Las historias creadas en tus proyectos aparecerán aquí."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentStories.map((story) => (
                    <Link
                      key={story.id}
                      to="/historias/$id"
                      params={{ id: story.id }}
                      className="group block p-5 transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">{story.codigo || "Sin código"}</p>
                          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{story.titulo}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {projectNames.get(story.proyecto_id) || "Proyecto no disponible"}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge value={story.prioridad} kind="prioridad" />
                        <StatusBadge value={story.estado} kind="historia" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
