import { cn } from "@/lib/utils";

export function Iniciales({ nombre, grande }: { nombre: string; grande?: boolean }) {
  const ini = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        grande ? "size-9 text-sm" : "size-5 text-[10px]",
      )}
      aria-hidden="true"
    >
      {ini}
    </span>
  );
}
