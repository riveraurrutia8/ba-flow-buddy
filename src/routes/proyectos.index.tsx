import { createFileRoute, redirect } from "@tanstack/react-router";

// El listado de proyectos ahora es el Portafolio ("/"); se conserva la ruta para no romper enlaces.
export const Route = createFileRoute("/proyectos/")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
