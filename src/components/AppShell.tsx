import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, Workflow, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/proyectos", label: "Proyectos", icon: FolderKanban },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeProps={{ className: "bg-sidebar-accent !text-sidebar-foreground" }}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Brand />
        <div className="mt-8">
          <NavLinks />
        </div>
        <p className="mt-auto text-xs text-sidebar-foreground/50">Gestión de análisis funcional</p>
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
        <span className="block text-base font-semibold tracking-tight text-foreground">BA Flow</span>
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

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
