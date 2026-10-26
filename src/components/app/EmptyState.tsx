import type { ReactNode } from "react";

export function EmptyState({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/60 p-8 text-center">
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
