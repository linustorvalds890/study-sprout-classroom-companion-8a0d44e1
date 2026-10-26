import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const field =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-60";
export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60";

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-card p-5 shadow-card", className)}>
      {title && <h2 className="mb-4 font-bold">{title}</h2>}
      {children}
    </section>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 block text-sm font-medium">
      {children}
      {hint && <span className="ml-1 font-normal text-muted-foreground">{hint}</span>}
    </span>
  );
}

/** Run a write, show a toast, refresh the given content lists. */
export function useSave() {
  const qc = useQueryClient();
  return async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string, keys: string[][]) => {
    const { error } = await fn();
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success(ok);
    await Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })));
    return true;
  };
}

export function confirmDelete(what: string) {
  return window.confirm(`Delete ${what}? This can't be undone.`);
}
