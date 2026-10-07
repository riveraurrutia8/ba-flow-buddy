import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight, LayoutGrid, Workflow, Menu, Users } from "lucide-react";
import { useState, type ReactNode } from "react";

import { api } from "@/lib/baflow";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Portafolio", icon: LayoutGrid },
  { to: "/equipo", label: "Equipo", icon: Users },
] as const;

const linkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground";
const activeClass = "bg-sidebar-accent !text-sidebar-foreground";

const puntoEstado: Record<string, string> = {
  Planificación: "bg-muted-foreground/60",
  "En ejecución": "bg-info",
  Finalizado: "bg-success",
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { data: proyectos } = useQuery({ queryKey: ["proyectos"], queryFn: api.listProyectos });

  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className={linkClass}
          activeProps={{ className: activeClass }}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
      <p className="mt-6 mb-1 px-3 text-xs font-medium tracking-wide text-sidebar-foreground/50 uppercase">
        Proyectos
      </p>
      {(proyectos ?? []).map((p) => (
        <Link
          key={p.id}
          to="/proyectos/$id"
          params={{ id: p.id }}
          onClick={onNavigate}
          className={linkClass}
          activeProps={{ className: activeClass }}
          title={p.nombre}
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              puntoEstado[p.estado] ?? "bg-muted-foreground/60",
            )}
            aria-hidden="true"
          />
          <span className="truncate">{p.nombre}</span>
        </Link>
      ))}
      {proyectos?.length === 0 && (
        <p className="px-3 text-xs text-sidebar-foreground/50">Aún no hay proyectos.</p>
      )}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Brand />
        <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <p className="pt-4 text-xs text-sidebar-foreground/50">Gestión de análisis funcional</p>
      </aside>

      <div className="lg:pl-64">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-foreground hover:bg-muted"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <Brand compact />
        </header>
        {open && (
          <div className="border-b border-border bg-card px-4 py-3 lg:hidden">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        )}
        <main className={cn("mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8")}>{children}</main>
      </div>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Workflow className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight text-foreground">
          BA Flow
        </span>
        {!compact && (
          <span className="block text-xs text-muted-foreground">Business Analyst Suite</span>
        )}
      </span>
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

type Miga = {
  label: string;
  to?: "/" | "/proyectos/$id";
  params?: { id: string };
  search?: { tab?: "resumen" | "backlog" | "equipo" };
};

// Ruta de navegación: Portafolio › Proyecto › Historia.
export function Migas({ items }: { items: Miga[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
            {it.to ? (
              <Link
                to={it.to}
                params={it.params as never}
                search={it.search as never}
                className="truncate hover:text-foreground"
              >
                {it.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
